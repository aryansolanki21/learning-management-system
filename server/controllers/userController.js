import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import validator from "validator";
import { OAuth2Client } from "google-auth-library";

import { generateAuthTokens } from "../utils/generate-token.js";
import { parseDurationToMilliseconds } from "../utils/time.js";
import { sendVerificationOtpEmail } from "../utils/email.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/auth-cookies.js";

import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;

const hashEmailVerificationOtp = (email, otp) => {
  if (!process.env.EMAIL_OTP_SECRET) {
    throw new Error("EMAIL_OTP_SECRET is not configured.");
  }

  return crypto
    .createHmac("sha256", process.env.EMAIL_OTP_SECRET)
    .update(`${email}:${otp}`)
    .digest("hex");
};

const clearEmailVerificationOtp = (user) => {
  user.emailVerificationOtpHash = null;
  user.emailVerificationOtpExpiresAt = null;
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = null;
};

const toSafeUser = (user) => {
  const safeUser = user.toObject();

  delete safeUser.password;
  delete safeUser.refreshTokenHash;
  delete safeUser.refreshTokenExpiresAt;
  delete safeUser.emailVerificationOtpHash;
  delete safeUser.emailVerificationOtpExpiresAt;
  delete safeUser.emailVerificationAttempts;
  delete safeUser.emailVerificationLastSentAt;

  return safeUser;
};

const sendEmailVerificationOtp = async (user) => {
  const now = Date.now();
  const lastSentAt = user.emailVerificationLastSentAt
    ? new Date(user.emailVerificationLastSentAt).getTime()
    : 0;

  const elapsed = now - lastSentAt;

  if (lastSentAt && elapsed < EMAIL_OTP_RESEND_COOLDOWN_MS) {
    const error = new Error(
      "Please wait before requesting another verification code.",
    );

    error.statusCode = 429;
    error.retryAfterSeconds = Math.ceil(
      (EMAIL_OTP_RESEND_COOLDOWN_MS - elapsed) / 1000,
    );

    throw error;
  }

  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

  user.emailVerificationOtpHash = hashEmailVerificationOtp(user.email, otp);
  user.emailVerificationOtpExpiresAt = new Date(now + EMAIL_OTP_TTL_MS);
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = new Date(now);

  await user.save();

  try {
    await sendVerificationOtpEmail({
      to: user.email,
      otp,
    });
  } catch (error) {
    clearEmailVerificationOtp(user);
    await user.save();

    throw error;
  }
};

const createAuthenticatedSession = async (res, user, message) => {
  const { accessToken, refreshToken } = generateAuthTokens(user._id.toString());

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(
    Date.now() +
      parseDurationToMilliseconds(process.env.JWT_REFRESH_EXPIRES_IN),
  );

  await user.save();

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json({
      success: true,
      message,
      user: toSafeUser(user),
    });
};

// Register a new account and send an email verification code.
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const trimmedName = name?.trim();

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const passwordOptions = {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
      returnScore: false,
    };

    if (!validator.isStrongPassword(password, passwordOptions)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters and contain an uppercase letter, lowercase letter, and number.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationAttempts +emailVerificationLastSentAt",
    );

    if (existingUser) {
      if (existingUser.emailVerified !== false) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists. Please log in.",
        });
      }

      // An unverified registration can request another code.
      try {
        await sendEmailVerificationOtp(existingUser);

        return res.status(200).json({
          success: true,
          message: "A verification code has been sent to your email.",
        });
      } catch (error) {
        if (error.statusCode === 429) {
          return res.status(429).json({
            success: false,
            message: error.message,
            retryAfterSeconds: error.retryAfterSeconds,
          });
        }

        console.error("Verification email delivery failed:", error.message);

        return res.status(502).json({
          success: false,
          message:
            "We couldn't send the verification email. Please try again later.",
        });
      }
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: false,
    });

    try {
      await sendEmailVerificationOtp(user);

      return res.status(201).json({
        success: true,
        message:
          "A verification code has been sent to your email. Enter it to complete registration.",
      });
    } catch (error) {
      console.error("Verification email delivery failed:", error.message);

      return res.status(502).json({
        success: false,
        message:
          "We couldn't send the verification email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to register.",
    });
  }
};

// Verify the registration email and establish an authenticated session.
export const verifyEmailOtp = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const otp = String(req.body.otp ?? "").trim();

    if (
      !normalizedEmail ||
      !validator.isEmail(normalizedEmail) ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address and six-digit code.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationAttempts +emailVerificationLastSentAt",
    );

    if (!user || user.emailVerified !== false) {
      return res.status(400).json({
        success: false,
        message: "The verification request is invalid or has expired.",
      });
    }

    if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message:
          "The verification code is invalid or expired. Request a new code.",
      });
    }

    if (user.emailVerificationOtpExpiresAt.getTime() <= Date.now()) {
      clearEmailVerificationOtp(user);
      await user.save();

      return res.status(400).json({
        success: false,
        message: "The verification code has expired. Request a new code.",
      });
    }

    if (user.emailVerificationAttempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Request a new verification code.",
      });
    }

    const providedHash = Buffer.from(
      hashEmailVerificationOtp(normalizedEmail, otp),
      "hex",
    );

    const storedHash = Buffer.from(user.emailVerificationOtpHash, "hex");

    const isMatch =
      providedHash.length === storedHash.length &&
      crypto.timingSafeEqual(providedHash, storedHash);

    if (!isMatch) {
      user.emailVerificationAttempts += 1;
      await user.save();

      if (user.emailVerificationAttempts >= EMAIL_OTP_MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Request a new verification code.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "The verification code is incorrect.",
      });
    }

    user.emailVerified = true;
    clearEmailVerificationOtp(user);

    return await createAuthenticatedSession(
      res,
      user,
      "Email verified successfully. You are now logged in.",
    );
  } catch (error) {
    console.error("Email verification failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to verify email.",
    });
  }
};

// Resend a registration verification code.
export const resendVerificationOtp = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();

    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationAttempts +emailVerificationLastSentAt",
    );

    // Avoid revealing whether an email has a registered account.
    if (!user || user.emailVerified !== false) {
      return res.status(200).json({
        success: true,
        message:
          "If registration is pending for this email, a verification code will be sent.",
      });
    }

    try {
      await sendEmailVerificationOtp(user);
    } catch (error) {
      if (error.statusCode === 429) {
        return res.status(429).json({
          success: false,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        });
      }

      console.error("Verification email delivery failed:", error.message);

      return res.status(502).json({
        success: false,
        message:
          "We couldn't send the verification email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend verification failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to resend verification code.",
    });
  }
};

// Authenticate user and issue access + refresh tokens
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        code: "GOOGLE_ACCOUNT",
        message:
          "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in.",
      });
    }

    return await createAuthenticatedSession(
      res,
      user,
      `Welcome back ${user.name}`,
    );
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to login.",
    });
  }
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body || {};

  if (!credential || typeof credential !== "string") {
    return res.status(400).json({
      success: false,
      message: "Google credential is required.",
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("GOOGLE_CLIENT_ID is not configured.");

    return res.status(503).json({
      success: false,
      message: "Google sign-in is not configured.",
    });
  }

  // Verify the ID token received from Google's frontend sign-in flow.
  let payload;

  try {
    const googleClient = new OAuth2Client(clientId);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    payload = ticket.getPayload();
  } catch (error) {
    console.warn("Google ID token verification failed:", error.message);

    return res.status(401).json({
      success: false,
      message: "Google sign-in could not be verified. Please try again.",
    });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({
      success: false,
      message: "Google must provide a verified email address.",
    });
  }

  const normalizedEmail = payload.email.trim().toLowerCase();

  try {
    // First, find an account already linked to this Google identity.
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      // If this email already belongs to a SkillNest account, link it
      // only because Google has confirmed ownership of the email.
      user = await User.findOne({
        email: normalizedEmail,
      }).select(
        "+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationAttempts +emailVerificationLastSentAt",
      );

      if (user) {
        // Never silently replace an account's existing Google identity.
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({
            success: false,
            message: "This email is linked to a different Google account.",
          });
        }

        user.googleId = payload.sub;
        user.emailVerified = true;

        if (!user.photoUrl && payload.picture) {
          user.photoUrl = payload.picture;
        }

        // The verified Google email also satisfies a pending email
        // verification for this same address.
        clearEmailVerificationOtp(user);
      } else {
        // Create a new Google-only SkillNest account.
        user = new User({
          name: payload.name?.trim() || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          authProvider: "google",
          googleId: payload.sub,
          emailVerified: true,
          photoUrl: payload.picture || "",
        });
      }
    }

    // Use the existing cookie-based session for Google and password login.
    return await createAuthenticatedSession(
      res,
      user,
      `Welcome back ${user.name}`,
    );
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account conflict occurred. Please try signing in again.",
      });
    }

    console.error("Google login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Google sign-in failed. Please try again.",
    });
  }
};

// Refresh access token using a valid refresh token
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    if (user.refreshTokenExpiresAt < new Date()) {
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await user.save();

      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
      });
    }

    const incomingTokenHash = hashRefreshToken(refreshToken);

    if (incomingTokenHash !== user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // Rotate both tokens.
    const { accessToken, refreshToken: newRefreshToken } = generateAuthTokens(
      user._id.toString(),
    );

    user.refreshTokenHash = hashRefreshToken(newRefreshToken);

    user.refreshTokenExpiresAt = new Date(
      Date.now() +
        parseDurationToMilliseconds(process.env.JWT_REFRESH_EXPIRES_IN),
    );

    await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessTokenCookieOptions)
      .cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions)
      .json({
        success: true,
        message: "Access token refreshed successfully.",
      });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    console.error("Refresh token error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to refresh access token.",
    });
  }
};

// Clear authentication and revoke refresh token
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET,
        );

        if (decoded.userId) {
          await User.findByIdAndUpdate(decoded.userId, {
            $set: {
              refreshTokenHash: null,
              refreshTokenExpiresAt: null,
            },
          });
        }
      } catch (error) {
        // Even if the refresh token is invalid or expired,
        // we still clear the authentication cookies.
      }
    }

    return res
      .status(200)
      .clearCookie("accessToken", accessTokenCookieOptions)
      .clearCookie("refreshToken", refreshTokenCookieOptions)
      .json({
        success: true,
        message: "Logged out successfully.",
      });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to logout.",
    });
  }
};

// Retrieve authenticated user's profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .select("-password -refreshTokenHash -refreshTokenExpiresAt")
      .populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile.",
    });
  }
};

// Update authenticated user's profile information
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;
    const profilePhoto = req.file;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let photoUrl = user.photoUrl;

    if (profilePhoto) {
      if (user.photoUrl) {
        // extract public id of the old image from the url is it exist
        const publicId = user.photoUrl.split("/").pop().split(".")[0];
        await deleteMediaFromCloudinary(publicId);
      }

      const cloudResponse = await uploadMedia(profilePhoto.path);

      if (!cloudResponse) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload image.",
        });
      }

      photoUrl = cloudResponse.secure_url;
    }

    const updatedData = {};

    if (name?.trim()) {
      updatedData.name = name.trim();
    }

    if (photoUrl) {
      updatedData.photoUrl = photoUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      returnDocument: "after",
    }).select("-password -refreshTokenHash -refreshTokenExpiresAt");

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Profile update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

// Retrieve enrolled courses with learning progress
export const getMyLearning = async (req, res) => {
  try {
    const userId = req.userId;

    // Get the authenticated user's enrolled course IDs.
    const user = await User.findById(userId).select("enrolledCourses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const courseIds = user.enrolledCourses || [];

    if (courseIds.length === 0) {
      return res.status(200).json({
        success: true,
        courses: [],
      });
    }

    // Fetch all enrolled courses in one query.
    const courses = await Course.find({
      _id: { $in: courseIds },
    })
      .populate({
        path: "creator",
        select: "name photoUrl",
      })
      .select(
        "title subtitle category level price thumbnail creator lectures createdAt updatedAt",
      );

    // Fetch progress for all enrolled courses in one query.
    const progressRecords = await CourseProgress.find({
      userId,
      courseId: { $in: courseIds },
    }).select("courseId completed lectureProgress");

    // Map progress by course ID for O(1) lookup.
    const progressMap = new Map(
      progressRecords.map((progress) => [
        progress.courseId.toString(),
        progress,
      ]),
    );

    const coursesWithProgress = courses.map((course) => {
      const courseId = course._id.toString();
      const progress = progressMap.get(courseId);

      const totalLectures = course.lectures?.length || 0;

      // Count only viewed lectures that currently belong to this course.
      const courseLectureIds = new Set(
        (course.lectures || []).map((lectureId) => lectureId.toString()),
      );

      const completedLectures = progress
        ? progress.lectureProgress.filter(
            (lectureProgress) =>
              lectureProgress.viewed &&
              courseLectureIds.has(lectureProgress.lectureId.toString()),
          ).length
        : 0;

      const progressPercentage =
        totalLectures > 0
          ? Math.round((completedLectures / totalLectures) * 100)
          : 0;

      const completed =
        totalLectures > 0 && completedLectures === totalLectures;

      return {
        ...course.toObject(),

        progress: {
          totalLectures,
          completedLectures,
          progressPercentage,
          completed,
        },
      };
    });

    // Keep the same order as User.enrolledCourses.
    const courseOrder = new Map(
      courseIds.map((courseId, index) => [courseId.toString(), index]),
    );

    coursesWithProgress.sort(
      (a, b) =>
        courseOrder.get(a._id.toString()) - courseOrder.get(b._id.toString()),
    );

    return res.status(200).json({
      success: true,
      courses: coursesWithProgress,
    });
  } catch (error) {
    console.error("Failed to fetch My Learning courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch learning progress.",
    });
  }
};

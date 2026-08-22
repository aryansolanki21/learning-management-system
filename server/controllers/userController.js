import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import validator from "validator";

import { generateAuthTokens } from "../utils/generate-token.js";
import { parseDurationToMilliseconds } from "../utils/time.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/auth-cookies.js";

import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Register a new user account
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

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const saltRound = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

    const hashedPassword = await bcrypt.hash(password, saltRound);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register.",
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

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const { accessToken, refreshToken } = generateAuthTokens(
      user._id.toString(),
    );

    // Store only the hash of the refresh token.
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
        message: `Welcome back ${user.name}`,
        user,
      });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to login.",
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
      .select("-password")
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
    }).select("-password");

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

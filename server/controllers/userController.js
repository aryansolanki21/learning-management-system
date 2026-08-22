import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

// Register a new user account
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email.",
      });
    }

    const saltRound = parseInt(process.env.SALT_ROUND) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRound);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to register.",
    });
  }
};

// Authenticate user and issue JWT cookie
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to login.",
    });
  }
};

// Clear authentication cookie
export const logout = async (_, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
      })
      .json({
        success: true,
        message: "Logged out successfully.",
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout.",
    });
  }
};

// Retrieve authenticated user's profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.id;
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
    const {
      id: userId,
      body: { name },
      file: profilePhoto,
    } = req;

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

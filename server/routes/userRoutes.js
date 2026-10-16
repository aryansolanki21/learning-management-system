import express from "express";
import { rateLimit } from "express-rate-limit";

import {
  register,
  login,
  googleLogin,
  logout,
  refreshAccessToken,
  verifyEmailOtp,
  resendVerificationOtp,
  getMyLearning,
  getUserProfile,
  updateProfile,
} from "../controllers/userController.js";

import authenticateUser from "../middlewares/authenticate-user.js";
import upload from "../utils/multer.js";

const router = express.Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
});

const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many resend requests. Please try again later.",
  },
});

// Public authentication routes
router.route("/register").post(registrationLimiter, register);
router.route("/login").post(login);
router.route("/google").post(googleLogin);
router.route("/refresh").post(refreshAccessToken);
router.route("/logout").post(logout);

router.route("/verify-email").post(verificationLimiter, verifyEmailOtp);

router.route("/resend-verification").post(resendLimiter, resendVerificationOtp);

// Protected user routes
router.route("/profile").get(authenticateUser, getUserProfile);
router
  .route("/profile/update")
  .put(authenticateUser, upload.single("profilePhoto"), updateProfile);

// Retrieve enrolled courses with learning progress
router.route("/my-learning").get(authenticateUser, getMyLearning);

export default router;

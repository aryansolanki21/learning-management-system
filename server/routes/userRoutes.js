import express from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getMyLearning,
  getUserProfile,
  updateProfile,
} from "../controllers/userController.js";

import authenticateUser from "../middlewares/authenticate-user.js";
import upload from "../utils/multer.js";

const router = express.Router();

// Public authentication routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh").post(refreshAccessToken);
router.route("/logout").post(logout);

// Protected user routes
router.route("/profile").get(authenticateUser, getUserProfile);
router
  .route("/profile/update")
  .put(authenticateUser, upload.single("profilePhoto"), updateProfile);

// Retrieve enrolled courses with learning progress
router.route("/my-learning").get(authenticateUser, getMyLearning);

export default router;

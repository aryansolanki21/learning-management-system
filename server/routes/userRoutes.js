import express from "express";
import {
  getUserProfile,
  login,
  logout,
  refreshAccessToken,
  register,
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

export default router;

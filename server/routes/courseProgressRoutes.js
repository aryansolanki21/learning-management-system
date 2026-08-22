import express from "express";

import authenticateUser from "../middlewares/authenticate-user.js";
import {
  getCourseProgress,
  markAsCompleted,
  markAsInCompleted,
  updateLectureProgress,
} from "../controllers/courseProgressController.js";

const router = express.Router();

router.route("/:courseId").get(authenticateUser, getCourseProgress);
router
  .route("/:courseId/lecture/:lectureId/view")
  .post(authenticateUser, updateLectureProgress);

router.route("/:courseId/complete").post(authenticateUser, markAsCompleted);
router.route("/:courseId/incomplete").post(authenticateUser, markAsInCompleted);

export default router;

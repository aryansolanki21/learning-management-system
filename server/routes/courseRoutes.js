import express from "express";

import authenticateUser from "../middlewares/authenticate-user.js";
import {
  createCourse,
  createLecture,
  editCourse,
  editLecture,
  getCourseById,
  getCourseLecture,
  getCreatorCourses,
  getLectureById,
  getPublishedCourse,
  removeLecture,
  searchCourse,
  togglePublishCourse,
} from "../controllers/courseController.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.route("/").post(authenticateUser, createCourse);
router.route("/search").get(searchCourse);

router.route("/published-courses").get(getPublishedCourse);
router.route("/").get(authenticateUser, getCreatorCourses);
router
  .route("/:courseId")
  .put(authenticateUser, upload.single("courseThumbnail"), editCourse);
router.route("/:courseId").get(getCourseById);
router.route("/:courseId/lecture").post(authenticateUser, createLecture);
router.route("/:courseId/lecture").get(authenticateUser, getCourseLecture);
router
  .route("/:courseId/lecture/:lectureId")
  .post(authenticateUser, editLecture);
router.route("/lecture/:lectureId").delete(authenticateUser, removeLecture);
router.route("/lecture/:lectureId").get(authenticateUser, getLectureById);
router.route("/:courseId").patch(authenticateUser, togglePublishCourse);

export default router;

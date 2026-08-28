import express from "express";

import authenticateUser from "../middlewares/authenticate-user.js";
import {
  createCourse,
  createLecture,
  editCourse,
  editLecture,
  getCourseById,
  getCourseLectures,
  getCreatorCourses,
  getLectureById,
  getPublishedCourses,
  removeLecture,
  searchCourses,
  togglePublishCourse,
} from "../controllers/courseController.js";
import upload from "../utils/multer.js";

const router = express.Router();

router
  .route("/")
  .post(authenticateUser, createCourse)
  .get(authenticateUser, getCreatorCourses);
router.route("/search").get(searchCourses);

router.route("/published-courses").get(getPublishedCourses);

router
  .route("/:courseId")
  .get(getCourseById)
  .patch(authenticateUser, upload.single("thumbnail"), editCourse);

router.route("/:courseId/publish").patch(authenticateUser, togglePublishCourse);

router
  .route("/:courseId/lecture")
  .post(authenticateUser, createLecture)
  .get(authenticateUser, getCourseLectures);

router
  .route("/:courseId/lecture/:lectureId")
  .patch(authenticateUser, editLecture)
  .delete(authenticateUser, removeLecture);

router.route("/lecture/:lectureId").get(authenticateUser, getLectureById);

export default router;

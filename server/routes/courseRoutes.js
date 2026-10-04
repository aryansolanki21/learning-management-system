import express from "express";

import authenticateUser from "../middlewares/authenticate-user.js";
import {
  createCourse,
  getPublishedCourses,
  getCourseById,
  searchCourses,
  getCreatorCourses,
  editCourse,
  deleteCourse,
  togglePublishCourse,
  createLecture,
  getCourseLectures,
  editLecture,
  removeLecture,
} from "../controllers/courseController.js";
import upload from "../utils/multer.js";

import { getRecommendedCourses } from "../controllers/recommendationController.js";

const router = express.Router();

router
  .route("/")
  .post(authenticateUser, upload.single("thumbnail"), createCourse)
  .get(authenticateUser, getCreatorCourses);

router.route("/search").get(searchCourses);

router.route("/published-courses").get(getPublishedCourses);

router.route("/recommended").get(authenticateUser, getRecommendedCourses);

router
  .route("/:courseId")
  .get(getCourseById)
  .patch(authenticateUser, upload.single("thumbnail"), editCourse)
  .delete(authenticateUser, deleteCourse);

router.route("/:courseId/publish").patch(authenticateUser, togglePublishCourse);

router
  .route("/:courseId/lecture")
  .post(authenticateUser, createLecture)
  .get(authenticateUser, getCourseLectures);

router
  .route("/:courseId/lecture/:lectureId")
  .patch(authenticateUser, editLecture)
  .delete(authenticateUser, removeLecture);


export default router;

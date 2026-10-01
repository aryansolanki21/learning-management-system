import express from "express";

import authenticateUser from "../middlewares/authenticate-user.js";

import {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

// Get all reviews for a course
router.route("/:courseId/reviews").get(getCourseReviews);

// Create a review for a purchased course
router
  .route("/:courseId/review")
  .post(authenticateUser, createReview)
  .patch(authenticateUser, updateReview)
  .delete(authenticateUser, deleteReview);

export default router;

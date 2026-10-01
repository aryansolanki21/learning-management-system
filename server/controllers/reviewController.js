import mongoose from "mongoose";

import { Review } from "../models/review.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";

// Create a review for a purchased course
export const createReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    // Validate rating
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    // Validate comment
    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Review comment is required.",
      });
    }

    const trimmedComment = comment.trim();

    if (trimmedComment.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be at least 3 characters long.",
      });
    }

    if (trimmedComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review comment cannot exceed 1000 characters.",
      });
    }

    // Check whether course exists
    const course = await Course.findById(courseId).select("_id");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // User must have completed the purchase.
    const completedPurchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    }).select("_id");

    if (!completedPurchase) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course before reviewing it.",
      });
    }

    // User must also complete the course.
    const courseProgress = await CourseProgress.findOne({
      userId,
      courseId,
    }).select("completed");

    if (!courseProgress?.completed) {
      return res.status(403).json({
        success: false,
        message: "You must complete the course before reviewing it.",
      });
    }

    // Check whether the user has already reviewed this course
    const existingReview = await Review.findOne({
      user: userId,
      course: courseId,
    }).select("_id");

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this course.",
      });
    }

    // Create review
    const review = await Review.create({
      user: userId,
      course: courseId,
      rating: numericRating,
      comment: trimmedComment,
    });

    // Populate reviewer information for frontend
    await review.populate({
      path: "user",
      select: "name photoUrl",
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review,
    });
  } catch (error) {
    // Handle duplicate review race condition
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this course.",
      });
    }

    console.error("Create review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit review.",
    });
  }
};

// Get all reviews for a course
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    // Check whether course exists
    const course = await Course.findById(courseId).select("_id");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Fetch reviews
    const reviews = await Review.find({
      course: courseId,
    })
      .populate({
        path: "user",
        select: "name photoUrl",
      })
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              totalReviews
            ).toFixed(1),
          )
        : 0;

    return res.status(200).json({
      success: true,
      reviews,
      averageRating,
      totalReviews,
    });
  } catch (error) {
    console.error("Get course reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course reviews.",
    });
  }
};

// Update user's own review
export const updateReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    // Validate rating
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    // Validate comment
    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Review comment is required.",
      });
    }

    const trimmedComment = comment.trim();

    if (trimmedComment.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be at least 3 characters long.",
      });
    }

    if (trimmedComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review comment cannot exceed 1000 characters.",
      });
    }

    // Find user's review for this course
    const review = await Review.findOne({
      user: userId,
      course: courseId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    const courseProgress = await CourseProgress.findOne({
      userId,
      courseId,
    }).select("completed");

    if (!courseProgress?.completed) {
      return res.status(403).json({
        success: false,
        message: "You must complete the course before editing your review.",
      });
    }

    // Update review
    review.rating = numericRating;
    review.comment = trimmedComment;

    await review.save();

    // Populate reviewer information
    await review.populate({
      path: "user",
      select: "name photoUrl",
    });

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update review.",
    });
  }
};

// Delete user's own review
export const deleteReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    // Find and delete only the logged-in user's review
    const review = await Review.findOneAndDelete({
      user: userId,
      course: courseId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete review.",
    });
  }
};

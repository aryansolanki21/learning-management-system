import { useState } from "react";
import { useSelector } from "react-redux";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Star, Pencil, Trash2, X } from "lucide-react";

import {
  useGetCourseReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from "@/features/api/reviewApi.js";

import { useGetCourseProgressQuery } from "@/features/api/courseProgressApi.js";

const CourseReviews = ({ courseId, isPurchased }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Get course reviews
  const { data, isLoading, isError, refetch } = useGetCourseReviewsQuery(
    courseId,
    {
      skip: !courseId,
    },
  );

  // Get course completion status only for authenticated purchasers.
  const shouldCheckCompletion = isAuthenticated && isPurchased;

  const {
    data: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError,
  } = useGetCourseProgressQuery(courseId, {
    skip: !shouldCheckCompletion,
  });

  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();

  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();

  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const reviews = data?.reviews || [];
  const averageRating = data?.averageRating || 0;
  const totalReviews = data?.totalReviews || 0;

  // Existing course completion status from CourseProgress.
  const isCourseCompleted = progressData?.data?.completed === true;

  // Find the current user's review.
  const myReview = reviews.find(
    (review) => String(review.user?._id) === String(user?._id),
  );

  // Keep the current user's review out of the general review list.
  const otherReviews = reviews.filter(
    (review) => String(review.user?._id) !== String(user?._id),
  );

  const isSubmitting = isCreating || isUpdating;

  const resetForm = () => {
    setRating(0);
    setComment("");
    setIsEditing(false);
    setFormError("");
    setSuccessMessage("");
  };

  const startEditing = () => {
    // Editing is allowed only when the course is completed.
    if (!myReview || !isCourseCompleted) return;

    setRating(myReview.rating);
    setComment(myReview.comment);
    setIsEditing(true);
    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (!isAuthenticated || !user) {
      setFormError("Please log in to submit a review.");
      return;
    }

    if (!isPurchased) {
      setFormError("You must purchase this course before reviewing it.");
      return;
    }

    // Frontend check for better UX.
    // Backend also enforces this rule.
    if (!isCourseCompleted) {
      setFormError("You must complete the course before reviewing it.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError("Please select a rating from 1 to 5 stars.");
      return;
    }

    const trimmedComment = comment.trim();

    if (trimmedComment.length < 3) {
      setFormError("Your review must contain at least 3 characters.");
      return;
    }

    if (trimmedComment.length > 1000) {
      setFormError("Your review cannot exceed 1000 characters.");
      return;
    }

    try {
      if (isEditing) {
        await updateReview({
          courseId,
          rating,
          comment: trimmedComment,
        }).unwrap();

        setSuccessMessage("Your review was updated successfully.");
      } else {
        await createReview({
          courseId,
          rating,
          comment: trimmedComment,
        }).unwrap();

        setSuccessMessage("Your review was submitted successfully.");
      }

      setRating(0);
      setComment("");
      setIsEditing(false);
    } catch (error) {
      setFormError(
        error?.data?.message || "Something went wrong. Please try again.",
      );
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your review?",
    );

    if (!confirmed) return;

    setFormError("");
    setSuccessMessage("");

    try {
      await deleteReview(courseId).unwrap();

      resetForm();
      setSuccessMessage("Your review was deleted successfully.");
    } catch (error) {
      setFormError(
        error?.data?.message ||
          "Failed to delete your review. Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-5">
        <h2 className="text-xl font-bold md:text-2xl">Student Reviews</h2>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse space-y-3 border-b pb-5">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-5">
        <h2 className="text-xl font-bold md:text-2xl">Student Reviews</h2>

        <p className="text-sm text-red-500">Failed to load course reviews.</p>

        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* Rating summary */}
      <div>
        <h2 className="text-xl font-bold md:text-2xl">Student Reviews</h2>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star size={20} className="fill-yellow-400 text-yellow-400" />

            <span className="text-lg font-bold">
              {averageRating.toFixed(1)}
            </span>
          </div>

          <span className="text-sm text-gray-500">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      {/* Logged-in purchaser review section */}
      {isAuthenticated && isPurchased && (
        <div className="rounded-lg border p-5 md:p-6">
          {/* Existing review */}
          {myReview && !isEditing ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Your Review</h3>

              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    className={
                      index < myReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {myReview.comment}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startEditing}
                  disabled={
                    isDeleting ||
                    isProgressLoading ||
                    isProgressError ||
                    !isCourseCompleted
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Review
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />

                  {isDeleting ? "Deleting..." : "Delete Review"}
                </Button>
              </div>

              {!isProgressLoading && !isProgressError && !isCourseCompleted && (
                <p className="text-sm text-gray-500">
                  Complete the course to edit your review.
                </p>
              )}
            </div>
          ) : isProgressLoading ? (
            /* Checking completion status */
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Checking course completion status...
              </p>
            </div>
          ) : isProgressError ? (
            /* Progress loading error */
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-500">
                Unable to verify course completion. Please refresh the page and
                try again.
              </p>
            </div>
          ) : !isCourseCompleted ? (
            /* Course not completed */
            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Review locked</h3>

              <p className="mt-1 text-sm text-gray-500">
                Complete all lectures in this course before submitting a review.
              </p>
            </div>
          ) : (
            /* Create / edit review form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">
                  {isEditing ? "Edit Your Review" : "Write a Review"}
                </h3>

                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>

              {/* Rating */}
              <div>
                <p className="mb-2 text-sm font-medium">Your Rating</p>

                <div
                  className="flex items-center gap-1"
                  role="radiogroup"
                  aria-label="Course rating"
                >
                  {Array.from({ length: 5 }).map((_, index) => {
                    const starRating = index + 1;

                    return (
                      <button
                        key={starRating}
                        type="button"
                        role="radio"
                        aria-checked={rating === starRating}
                        aria-label={`${starRating} ${
                          starRating === 1 ? "star" : "stars"
                        }`}
                        onClick={() => setRating(starRating)}
                        disabled={isSubmitting}
                        className="rounded-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        <Star
                          size={28}
                          className={
                            starRating <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    );
                  })}

                  <span className="ml-2 text-sm text-gray-500">
                    {rating > 0 ? `${rating}/5` : "Select a rating"}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label
                  htmlFor="course-review-comment"
                  className="text-sm font-medium"
                >
                  Your Review
                </label>

                <Textarea
                  id="course-review-comment"
                  placeholder="Share your experience with this course..."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  disabled={isSubmitting}
                  required
                />

                <p className="text-right text-xs text-gray-500">
                  {comment.length}/1000 characters
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Review"
                    : "Submit Review"}
              </Button>
            </form>
          )}

          {/* Single error message */}
          {formError && (
            <p role="alert" className="mt-3 text-sm text-red-500">
              {formError}
            </p>
          )}

          {/* Single success message */}
          {successMessage && (
            <p role="status" className="mt-3 text-sm text-green-600">
              {successMessage}
            </p>
          )}
        </div>
      )}

      {/* Not authenticated */}
      {!isAuthenticated && (
        <p className="text-sm text-gray-500">
          Log in and purchase this course to write a review.
        </p>
      )}

      {/* Authenticated but not purchased */}
      {isAuthenticated && !isPurchased && (
        <p className="text-sm text-gray-500">
          Purchase this course to share your review.
        </p>
      )}

      {/* Review list */}
      {otherReviews.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <Star size={32} className="mx-auto mb-3 text-gray-400" />

          <h3 className="text-lg font-semibold">
            {myReview ? "No other reviews yet" : "No reviews yet"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {myReview
              ? "You are currently the only student who has reviewed this course."
              : "Be the first student to review this course."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {otherReviews.map((review) => {
            const reviewerName = review.user?.name || "Student";

            const initials = reviewerName
              .split(" ")
              .filter(Boolean)
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                key={review._id}
                className="border-b pb-5 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={review.user?.photoUrl || ""}
                      alt={reviewerName}
                    />

                    <AvatarFallback>{initials || "ST"}</AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="text-sm font-semibold">{reviewerName}</p>

                    <div
                      className="mt-1 flex items-center gap-1"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={14}
                          className={
                            index < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {review.comment}
                </p>

                {review.createdAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}

                    {review.updatedAt &&
                      review.updatedAt !== review.createdAt && (
                        <span> · Edited</span>
                      )}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CourseReviews;

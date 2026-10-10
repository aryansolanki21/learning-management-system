import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { courseApi } from "@/features/api/courseApi.js";

const REVIEW_API = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/review`;

export const reviewApi = createApi({
  reducerPath: "reviewApi",

  tagTypes: ["Reviews"],

  baseQuery: fetchBaseQuery({
    baseUrl: REVIEW_API,
    credentials: "include",
  }),

  endpoints: (builder) => ({
    // Get all reviews, average rating and review count for a course
    getCourseReviews: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/reviews`,
        method: "GET",
      }),

      providesTags: (result, error, courseId) => [
        { type: "Reviews", id: courseId },
      ],
    }),

    // Submit a new review
    createReview: builder.mutation({
      query: ({ courseId, rating, comment }) => ({
        url: `/${courseId}/review`,
        method: "POST",
        body: {
          rating,
          comment,
        },
      }),

      invalidatesTags: (result, error, { courseId }) => [
        { type: "Reviews", id: courseId },
      ],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          dispatch(courseApi.util.invalidateTags(["PublishedCourses"]));
        } catch (error) {
          console.error("Failed to create review:", error);
        }
      },
    }),

    // Update logged-in user's review
    updateReview: builder.mutation({
      query: ({ courseId, rating, comment }) => ({
        url: `/${courseId}/review`,
        method: "PATCH",
        body: {
          rating,
          comment,
        },
      }),

      invalidatesTags: (result, error, { courseId }) => [
        { type: "Reviews", id: courseId },
      ],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          dispatch(courseApi.util.invalidateTags(["PublishedCourses"]));
        } catch (error) {
          console.error("Failed to update review:", error);
        }
      },
    }),

    // Delete logged-in user's review
    deleteReview: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/review`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, courseId) => [
        { type: "Reviews", id: courseId },
      ],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          dispatch(courseApi.util.invalidateTags(["PublishedCourses"]));
        } catch (error) {
          console.error("Failed to delete review:", error);
        }
      },
    }),
  }),
});

export const {
  useGetCourseReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;

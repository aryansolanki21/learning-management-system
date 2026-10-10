import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authApi } from "@/features/api/authApi.js";

const COURSE_PROGRESS_API = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/progress`;

export const courseProgressApi = createApi({
  reducerPath: "courseProgressApi",

  tagTypes: ["CourseProgress"],

  baseQuery: fetchBaseQuery({
    baseUrl: COURSE_PROGRESS_API,
    credentials: "include",
  }),

  endpoints: (builder) => ({
    getCourseProgress: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET",
      }),

      providesTags: (result, error, courseId) => [
        { type: "CourseProgress", id: courseId },
      ],
    }),

    updateLectureProgress: builder.mutation({
      query: ({ courseId, lectureId }) => ({
        url: `/${courseId}/lecture/${lectureId}/view`,
        method: "POST",
      }),

      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseProgress", id: courseId },
      ],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags(["MyLearning"]));
        } catch (error) {
          console.error("Failed to update learning progress:", error);
        }
      },
    }),

    completeCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/complete`,
        method: "POST",
      }),

      invalidatesTags: (result, error, courseId) => [
        { type: "CourseProgress", id: courseId },
      ],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags(["MyLearning"]));
        } catch (error) {
          console.error("Failed to complete course:", error);
        }
      },
    }),

    incompleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/incomplete`,
        method: "POST",
      }),

      invalidatesTags: (result, error, courseId) => [
        { type: "CourseProgress", id: courseId },
      ],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.invalidateTags(["MyLearning"]));
        } catch (error) {
          console.error("Failed to mark course as incomplete:", error);
        }
      },
    }),
  }),
});

export const {
  useGetCourseProgressQuery,
  useUpdateLectureProgressMutation,
  useCompleteCourseMutation,
  useIncompleteCourseMutation,
} = courseProgressApi;

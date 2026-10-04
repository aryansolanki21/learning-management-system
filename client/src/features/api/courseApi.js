import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const COURSE_API = "http://localhost:8080/api/v1/course";

export const courseApi = createApi({
  reducerPath: "courseApi",

  tagTypes: [
    "Refetch_Creator_Course",
    "Refetch_Lecture",
    "CourseDetails",
    "PublishedCourses",
    "RecommendedCourses",
  ],

  baseQuery: fetchBaseQuery({
    baseUrl: COURSE_API,
    credentials: "include",
  }),

  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: (formData) => ({
        url: "",
        method: "POST",
        body: formData,
      }),

      invalidatesTags: ["Refetch_Creator_Course"],
    }),

    searchCourses: builder.query({
      query: ({ searchQuery, categories, sortByPrice }) => {
        let queryString = `search?query=${encodeURIComponent(searchQuery)}`;

        if (categories && categories.length > 0) {
          const categoriesString = categories
            .map((category) => encodeURIComponent(category))
            .join(",");

          queryString += `&categories=${categoriesString}`;
        }

        if (sortByPrice) {
          queryString += `&sortByPrice=${encodeURIComponent(sortByPrice)}`;
        }

        return {
          url: queryString,
          method: "GET",
        };
      },
    }),

    getPublishedCourses: builder.query({
      query: () => ({
        url: "/published-courses",
        method: "GET",
      }),

      providesTags: ["PublishedCourses"],
    }),

    getRecommendedCourses: builder.query({
      query: () => ({
        url: "/recommended",
        method: "GET",
      }),

      providesTags: ["RecommendedCourses"],
    }),

    getCreatorCourses: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),

      providesTags: ["Refetch_Creator_Course"],
    }),

    getCourseById: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET",
      }),

      providesTags: (result, error, courseId) => [
        { type: "CourseDetails", id: courseId },
      ],
    }),

    editCourse: builder.mutation({
      query: ({ formData, courseId }) => ({
        url: `/${courseId}`,
        method: "PATCH",
        body: formData,
      }),

      invalidatesTags: (result, error, { courseId }) => [
        "Refetch_Creator_Course",
        { type: "CourseDetails", id: courseId },
        "PublishedCourses",
        "RecommendedCourses",
      ],
    }),

    deleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, courseId) => [
        "Refetch_Creator_Course",
        "PublishedCourses",
        "RecommendedCourses",
        { type: "CourseDetails", id: courseId },
      ],
    }),

    createLecture: builder.mutation({
      query: ({ title, courseId }) => ({
        url: `/${courseId}/lecture`,
        method: "POST",
        body: { title },
      }),

      invalidatesTags: (result, error, { courseId }) => [
        { type: "Refetch_Lecture", id: courseId },
        { type: "CourseDetails", id: courseId },
      ],
    }),

    getCourseLectures: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/lecture`,
        method: "GET",
      }),

      providesTags: (result, error, courseId) => [
        { type: "Refetch_Lecture", id: courseId },
      ],
    }),

    editLecture: builder.mutation({
      query: ({ title, videoInfo, isPreviewFree, courseId, lectureId }) => ({
        url: `/${courseId}/lecture/${lectureId}`,
        method: "PATCH",
        body: {
          title,
          videoInfo,
          isPreviewFree,
        },
      }),

      invalidatesTags: (result, error, { courseId }) => [
        { type: "Refetch_Lecture", id: courseId },
        { type: "CourseDetails", id: courseId },
      ],
    }),

    removeLecture: builder.mutation({
      query: ({ courseId, lectureId }) => ({
        url: `/${courseId}/lecture/${lectureId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, { courseId }) => [
        { type: "Refetch_Lecture", id: courseId },
        { type: "CourseDetails", id: courseId },
      ],
    }),

    publishCourse: builder.mutation({
      query: ({ courseId, query }) => ({
        url: `/${courseId}/publish?publish=${query}`,
        method: "PATCH",
      }),

      invalidatesTags: (result, error, { courseId }) => [
        "Refetch_Creator_Course",
        { type: "CourseDetails", id: courseId },
        "PublishedCourses",
        "RecommendedCourses",
      ],
    }),
  }),
});

export const {
  useCreateCourseMutation,
  useSearchCoursesQuery,
  useGetPublishedCoursesQuery,
  useGetRecommendedCoursesQuery,
  useGetCreatorCoursesQuery,
  useGetCourseByIdQuery,
  useEditCourseMutation,
  useDeleteCourseMutation,
  useCreateLectureMutation,
  useGetCourseLecturesQuery,
  useEditLectureMutation,
  useRemoveLectureMutation,
  usePublishCourseMutation,
} = courseApi;

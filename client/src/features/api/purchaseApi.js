import { courseApi } from "@/features/api/courseApi.js";
import { createApi } from "@reduxjs/toolkit/query/react";
import { analyticsApi } from "@/features/api/analyticsApi.js";
import { createBaseQueryWithReauth } from "@/features/api/baseQueryWithReauth.js";

const COURSE_PURCHASE_API = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/purchase`;

export const purchaseApi = createApi({
  reducerPath: "purchaseApi",
  tagTypes: ["Purchase"],

  baseQuery: createBaseQueryWithReauth(COURSE_PURCHASE_API),

  endpoints: (builder) => ({
    createRazorpayOrder: builder.mutation({
      query: (courseId) => ({
        url: "/checkout/create-order",
        method: "POST",
        body: { courseId },
      }),
    }),

    verifyRazorpayPayment: builder.mutation({
      query: (paymentData) => ({
        url: "/checkout/verify",
        method: "POST",
        body: paymentData,
      }),

      invalidatesTags: ["Purchase"],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          dispatch(
            courseApi.util.invalidateTags([
              "RecommendedCourses",
              "PublishedCourses",
            ]),
          );

          dispatch(
            analyticsApi.util.invalidateTags([
              {
                type: "InstructorDashboard",
                id: "SUMMARY",
              },
            ]),
          );
        } catch (error) {
          console.error("Failed to verify course purchase:", error);
        }
      },
    }),

    getCourseDetailWithPurchaseStatus: builder.query({
      query: (courseId) => ({
        url: `/course/${courseId}/detail-with-status`,
        method: "GET",
      }),

      providesTags: ["Purchase"],
    }),

    getAllPurchasedCourses: builder.query({
      query: () => ({
        url: `/`,
        method: "GET",
      }),

      providesTags: ["Purchase"],
    }),
  }),
});

export const {
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useGetCourseDetailWithPurchaseStatusQuery,
  useGetAllPurchasedCoursesQuery,
} = purchaseApi;

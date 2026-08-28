import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const COURSE_PURCHASE_API = "http://localhost:8080/api/v1/purchase";

export const purchaseApi = createApi({
  reducerPath: "purchaseApi",
  tagTypes: ["Purchase"],

  baseQuery: fetchBaseQuery({
    baseUrl: COURSE_PURCHASE_API,
    credentials: "include",
  }),

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

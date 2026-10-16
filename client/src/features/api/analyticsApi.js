import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "@/features/api/baseQueryWithReauth.js";

const ANALYTICS_API = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/analytics`;

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",

  tagTypes: ["InstructorDashboard"],

  baseQuery: createBaseQueryWithReauth(ANALYTICS_API),

  endpoints: (builder) => ({
    getInstructorDashboard: builder.query({
      query: (range = "30d") => ({
        url: "/instructor-dashboard",
        method: "GET",
        params: { range },
      }),

      providesTags: [
        {
          type: "InstructorDashboard",
          id: "SUMMARY",
        },
      ],
    }),
  }),
});

export const { useGetInstructorDashboardQuery } = analyticsApi;

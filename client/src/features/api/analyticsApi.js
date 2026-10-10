import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ANALYTICS_API = "http://localhost:8080/api/v1/analytics";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",

  tagTypes: ["InstructorDashboard"],

  baseQuery: fetchBaseQuery({
    baseUrl: ANALYTICS_API,
    credentials: "include",
  }),

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

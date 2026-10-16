import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "@/features/api/baseQueryWithReauth.js";
import { userLoggedIn, userLoggedOut } from "../authSlice.js";

const USER_API = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/user/`;

// RTK Query endpoints for authentication, user profile, and learning
export const authApi = createApi({
  reducerPath: "authApi",

  baseQuery: createBaseQueryWithReauth(USER_API),

  tagTypes: ["User", "MyLearning"],

  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (inputData) => ({
        url: "register",
        method: "POST",
        body: inputData,
      }),

      invalidatesTags: ["User"],
    }),

    verifyEmailOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: "verify-email",
        method: "POST",
        body: { email, otp },
      }),

      invalidatesTags: ["User", "MyLearning"],

      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLoggedIn({ user: data.user }));
        } catch (error) {
          console.error("Email verification failed:", error);
        }
      },
    }),

    resendVerificationOtp: builder.mutation({
      query: ({ email }) => ({
        url: "resend-verification",
        method: "POST",
        body: { email },
      }),
    }),

    loginUser: builder.mutation({
      query: (inputData) => ({
        url: "login",
        method: "POST",
        body: inputData,
      }),

      invalidatesTags: ["User", "MyLearning"],

      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLoggedIn({ user: data.user }));
        } catch (error) {
          console.error("Failed to login:", error);
        }
      },
    }),

    googleLogin: builder.mutation({
      query: ({ credential }) => ({
        url: "google",
        method: "POST",
        body: { credential },
      }),

      invalidatesTags: ["User", "MyLearning"],

      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLoggedIn({ user: data.user }));
        } catch (error) {
          console.error("Failed to sign in with Google:", error);
        }
      },
    }),

    logoutUser: builder.mutation({
      query: () => ({
        url: "logout",
        method: "POST",
      }),

      invalidatesTags: ["User", "MyLearning"],

      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          dispatch(userLoggedOut());
          dispatch(authApi.util.resetApiState());
        } catch (error) {
          console.error("Failed to logout:", error);
        }
      },
    }),

    loadUser: builder.query({
      query: () => ({
        url: "profile",
        method: "GET",
      }),

      providesTags: ["User"],

      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLoggedIn({ user: data.user }));
        } catch (error) {
          console.error("Failed to load user:", error);
        }
      },
    }),

    updateUser: builder.mutation({
      query: (formData) => ({
        url: "profile/update",
        method: "PUT",
        body: formData,
      }),

      invalidatesTags: ["User"],
    }),

    // Fetch enrolled courses with learning progress
    getMyLearning: builder.query({
      query: () => ({
        url: "my-learning",
        method: "GET",
      }),

      providesTags: ["MyLearning"],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useVerifyEmailOtpMutation,
  useResendVerificationOtpMutation,
  useLoginUserMutation,
  useGoogleLoginMutation,
  useLogoutUserMutation,
  useLoadUserQuery,
  useUpdateUserMutation,
  useGetMyLearningQuery,
} = authApi;

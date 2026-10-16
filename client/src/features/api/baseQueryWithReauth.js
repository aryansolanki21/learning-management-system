import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedOut } from "@/features/authSlice.js";

const API_ROOT = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const refreshBaseQuery = fetchBaseQuery({
  baseUrl: API_ROOT,
  credentials: "include",
});

// Shared by every API service to coordinate simultaneous 401 responses.
let refreshPromise = null;

// Identifies whether another request has already refreshed the session.
let authGeneration = 0;
let failedRefreshGeneration = null;

const getRequestUrl = (args) => {
  return typeof args === "string" ? args : args?.url || "";
};

const isAuthEndpoint = (url) =>
  /(^|\/)(login|register|refresh|logout|google|verify-email|resend-verification)(\/|$|\?)/i.test(
    url,
  );

const isLoginEndpoint = (url) =>
  /(^|\/)(login|google|verify-email)(\/|$|\?)/i.test(url);

export const createBaseQueryWithReauth = (baseUrl) => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    credentials: "include",
  });

  return async (args, api, extraOptions) => {
    const requestUrl = getRequestUrl(args);
    const requestGeneration = authGeneration;

    let result = await rawBaseQuery(args, api, extraOptions);

    // A successful login establishes a new authenticated session.
    if (isLoginEndpoint(requestUrl) && !result.error) {
      authGeneration += 1;
      failedRefreshGeneration = null;
    }

    // Do not attempt refresh for login, registration, refresh, or logout.
    if (result.error?.status !== 401 || isAuthEndpoint(requestUrl)) {
      return result;
    }

    // Another request already refreshed while this request was in flight.
    if (requestGeneration !== authGeneration) {
      return rawBaseQuery(args, api, extraOptions);
    }

    // Avoid repeatedly trying a refresh token already known to be invalid.
    if (failedRefreshGeneration === authGeneration) {
      api.dispatch(userLoggedOut());
      return result;
    }

    // Share one refresh operation across concurrent requests.
    if (!refreshPromise) {
      const generationBeingRefreshed = authGeneration;

      refreshPromise = refreshBaseQuery(
        {
          url: "/api/v1/user/refresh",
          method: "POST",
        },
        api,
        extraOptions,
      )
        .then((refreshResult) => {
          if (refreshResult.data) {
            authGeneration += 1;
          } else if (refreshResult.error?.status === 401) {
            failedRefreshGeneration = generationBeingRefreshed;
          }

          return refreshResult;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const refreshResult = await refreshPromise;

    if (refreshResult.data) {
      // The backend has issued fresh cookies. Retry the failed API request.
      return rawBaseQuery(args, api, extraOptions);
    }

    if (refreshResult.error?.status === 401) {
      // The refresh session is no longer valid.
      api.dispatch(userLoggedOut());
    }

    // Do not log the user out for temporary failures such as a server error.
    return result;
  };
};

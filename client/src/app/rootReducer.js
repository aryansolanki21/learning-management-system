import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";

import { authApi } from "@/features/api/authApi";
import { courseApi } from "@/features/api/courseApi.js";
import { purchaseApi } from "@/features/api/purchaseApi.js";

const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [courseApi.reducerPath]: courseApi.reducer,
  [purchaseApi.reducerPath]: purchaseApi.reducer,
  auth: authReducer,
});

export default rootReducer;

import express from "express";

import isAuthenticated from "../middlewares/isAuthenticated.js";

import {
  createCheckoutOrder,
  verifyPayment,
  getCourseDetailWithPurchaseStatus,
  getAllPurchasedCourses,
} from "../controllers/coursePurchaseController.js";

const router = express.Router();

router
  .route("/checkout/create-order")
  .post(isAuthenticated, createCheckoutOrder);

router.route("/checkout/verify").post(isAuthenticated, verifyPayment);

router
  .route("/course/:courseId/detail-with-status")
  .get(isAuthenticated, getCourseDetailWithPurchaseStatus);

router.route("/").get(isAuthenticated, getAllPurchasedCourses);

export default router;

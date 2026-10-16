import express from "express";

import authenticateUser, {
  optionalAuthenticateUser,
} from "../middlewares/authenticate-user.js";

import {
  createCheckoutOrder,
  verifyPayment,
  getCourseDetailWithPurchaseStatus,
  getAllPurchasedCourses,
} from "../controllers/coursePurchaseController.js";

const router = express.Router();

router
  .route("/checkout/create-order")
  .post(authenticateUser, createCheckoutOrder);

router.route("/checkout/verify").post(authenticateUser, verifyPayment);

router
  .route("/course/:courseId/detail-with-status")
  .get(optionalAuthenticateUser, getCourseDetailWithPurchaseStatus);

router.route("/").get(authenticateUser, getAllPurchasedCourses);

export default router;

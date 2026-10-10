import express from "express";

import authenticateUser from "../middlewares/authenticate-user.js";
import { getInstructorDashboard } from "../controllers/analyticsController.js";

const router = express.Router();

router
  .route("/instructor-dashboard")
  .get(authenticateUser, getInstructorDashboard);

export default router;

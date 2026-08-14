import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/db.js";

import userRoute from "./routes/userRoutes.js";
import courseRoute from "./routes/courseRoutes.js";
import mediaRoute from "./routes/mediaRoutes.js";
import purchaseRoute from "./routes/purchaseRoute.js";
import courseProgressRoute from "./routes/courseProgressRoutes.js";

// Load environment variables from .env
dotenv.config();

// Establish database connection
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Register global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Register application routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);

app.listen(PORT, () => {
  console.log(`Server listen at port ${PORT}`);
});

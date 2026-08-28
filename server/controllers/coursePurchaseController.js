import Razorpay from "razorpay";
import crypto from "crypto";

import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createCheckoutOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required.",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Course is not published.",
      });
    }

    if (!Number.isFinite(course.price) || course.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price.",
      });
    }

    const existingPurchase = await CoursePurchase.findOne({
      courseId,
      userId,
      status: "completed",
    });

    if (existingPurchase) {
      return res.status(409).json({
        success: false,
        message: "You have already purchased this course.",
      });
    }

    const options = {
      amount: Math.round(course.price * 100),
      currency: "INR",
      receipt: `course_${courseId}_${Date.now()}`,
      notes: {
        courseId: courseId.toString(),
        userId: userId.toString(),
      },
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(options);

    // Now create purchase record
    await CoursePurchase.create({
      courseId,
      userId,
      amount: course.price,
      status: "pending",
      orderId: order.id,
    });

    return res.status(201).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order.",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.userId;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required.",
      });
    }

    // Find the purchase using Razorpay order ID
    const purchase = await CoursePurchase.findOne({
      orderId: razorpay_order_id,
      userId,
    }).populate("courseId");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found.",
      });
    }

    // Prevent duplicate processing
    if (purchase.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified.",
      });
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${purchase.orderId}|${razorpay_payment_id}`)
      .digest("hex");

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }

    // Save Razorpay payment ID
    purchase.paymentId = razorpay_payment_id;
    purchase.status = "completed";

    await purchase.save();

    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        enrolledCourses: purchase.courseId._id,
      },
    });

    // Add user to course's enrolled students
    await Course.findByIdAndUpdate(purchase.courseId._id, {
      $addToSet: {
        enrolledStudents: userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment.",
    });
  }
};

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const course = await Course.findById(courseId)
      .populate({
        path: "creator",
        select: "name photoUrl",
      })
      .populate("lectures");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    const isPurchased = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    return res.status(200).json({
      success: true,
      course,
      isPurchased: !!isPurchased,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get course details.",
    });
  }
};

export const getAllPurchasedCourses = async (req, res) => {
  try {
    const instructorId = req.userId;

    // Find courses created by the logged-in instructor
    const courses = await Course.find({
      creator: instructorId,
    }).select("_id");

    const courseIds = courses.map((course) => course._id);

    // Find completed purchases for those courses
    const purchasedCourses = await CoursePurchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    }).populate("courseId");

    return res.status(200).json({
      success: true,
      purchasedCourses,
    });
  } catch (error) {
    console.error("Failed to fetch purchased courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get purchased courses.",
    });
  }
};

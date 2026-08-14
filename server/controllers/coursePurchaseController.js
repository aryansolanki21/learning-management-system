import Razorpay from "razorpay";
import crypto from "crypto";

import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { CoursePurchase } from "../models/CoursePurchase.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createCheckoutOrder = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

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

    const options = {
      amount: Math.round(course.coursePrice * 100),
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
    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending",
      orderId: order.id,
    });

    await newPurchase.save();

    return res.status(200).json({
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
    const userId = req.id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Find the purchase using Razorpay order ID
    const purchase = await CoursePurchase.findOne({
      orderId: razorpay_order_id,
      userId,
    }).populate({
      path: "courseId",
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found.",
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

    // Prevent duplicate processing
    if (purchase.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified.",
      });
    }

    // Save Razorpay payment ID
    purchase.paymentId = razorpay_payment_id;
    purchase.status = "completed";

    await purchase.save();

    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          enrolledCourses: purchase.courseId._id,
        },
      },
      { new: true },
    );

    // Add user to course's enrolled students
    await Course.findByIdAndUpdate(
      purchase.courseId._id,
      {
        $addToSet: {
          enrolledStudents: userId,
        },
      },
      { new: true },
    );

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
    const userId = req.id;

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

    const purchased = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    return res.status(200).json({
      success: true,
      course,
      purchased: !!purchased,
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
    const instructorId = req.id;

    // Find courses created by the logged-in instructor
    const courses = await Course.find({
      creator: instructorId,
    }).select("_id");

    const courseIds = courses.map((course) => course._id);

    // Find completed purchases for those courses
    const purchasedCourse = await CoursePurchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    }).populate("courseId");

    console.log("Purchased courses:", purchasedCourse);
    return res.status(200).json({
      success: true,
      purchasedCourse,
    });
  } catch (error) {
    console.error("Get purchased courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get purchased courses.",
    });
  }
};

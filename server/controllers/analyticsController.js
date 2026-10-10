import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = "Asia/Kolkata";

const RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return roundToTwo(((current - previous) / previous) * 100);
};

const getDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const getMonthKey = (date) => getDateKey(date).slice(0, 7);

const incrementDateKey = (key, increment) => {
  const [year, month, day] = key.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day + increment));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const incrementMonthKey = (key) => {
  const [year, month] = key.split("-").map(Number);

  const date = new Date(Date.UTC(year, month, 1));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
  ].join("-");
};

const getPurchaseSummary = async (match) => {
  const result = await CoursePurchase.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        revenue: {
          $sum: { $ifNull: ["$amount", 0] },
        },
        sales: { $sum: 1 },
        studentIds: { $addToSet: "$userId" },
      },
    },
    {
      $project: {
        _id: 0,
        revenue: 1,
        sales: 1,
        students: { $size: "$studentIds" },
      },
    },
  ]);

  return (
    result[0] || {
      revenue: 0,
      sales: 0,
      students: 0,
    }
  );
};

const fillRevenueTrend = (rows, range, startDate, now) => {
  const valuesByDate = new Map(rows.map((row) => [row.date, row]));

  let currentKey;
  const endKey = range === "all" ? getMonthKey(now) : getDateKey(now);

  if (range === "all") {
    if (rows.length === 0) {
      return [];
    }

    currentKey = rows[0].date;
  } else {
    currentKey = getDateKey(startDate);
  }

  const result = [];

  while (currentKey <= endKey) {
    const entry = valuesByDate.get(currentKey);

    result.push({
      date: currentKey,
      revenue: entry?.revenue ?? 0,
      sales: entry?.sales ?? 0,
    });

    currentKey =
      range === "all"
        ? incrementMonthKey(currentKey)
        : incrementDateKey(currentKey, 1);
  }

  return result;
};

export const getInstructorDashboard = async (req, res) => {
  try {
    const instructor = await User.findById(req.userId).select("role").lean();

    if (!instructor || instructor.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructors can access dashboard analytics.",
      });
    }

    const range = req.query.range || "30d";

    if (range !== "all" && !RANGE_DAYS[range]) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics time range.",
      });
    }

    const now = new Date();
    const days = RANGE_DAYS[range];

    const currentStart =
      days !== undefined ? new Date(now.getTime() - days * DAY_IN_MS) : null;

    const previousStart =
      days !== undefined
        ? new Date(currentStart.getTime() - days * DAY_IN_MS)
        : null;

    // Only include courses that currently belong to this instructor.
    const courses = await Course.find({
      creator: req.userId,
    })
      .select(
        "title thumbnail category price isPublished enrolledStudents createdAt",
      )
      .lean();

    const courseIds = courses.map((course) => course._id);

    const currentPurchaseMatch = {
      courseId: { $in: courseIds },
      status: "completed",
      ...(currentStart
        ? {
            createdAt: {
              $gte: currentStart,
              $lte: now,
            },
          }
        : {}),
    };

    const previousPurchaseMatch =
      days !== undefined
        ? {
            courseId: { $in: courseIds },
            status: "completed",
            createdAt: {
              $gte: previousStart,
              $lt: currentStart,
            },
          }
        : null;

    const trendFormat = range === "all" ? "%Y-%m" : "%Y-%m-%d";

    const [
      currentSummary,
      previousSummary,
      trendRows,
      courseSales,
      reviewStats,
      recentPurchases,
    ] = await Promise.all([
      getPurchaseSummary(currentPurchaseMatch),

      previousPurchaseMatch
        ? getPurchaseSummary(previousPurchaseMatch)
        : Promise.resolve(null),

      CoursePurchase.aggregate([
        { $match: currentPurchaseMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: trendFormat,
                date: "$createdAt",
                timezone: TIME_ZONE,
              },
            },
            revenue: {
              $sum: { $ifNull: ["$amount", 0] },
            },
            sales: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: 1,
            sales: 1,
          },
        },
        { $sort: { date: 1 } },
      ]),

      CoursePurchase.aggregate([
        { $match: currentPurchaseMatch },
        {
          $group: {
            _id: "$courseId",
            sales: { $sum: 1 },
            revenue: {
              $sum: { $ifNull: ["$amount", 0] },
            },
          },
        },
      ]),

      Review.aggregate([
        {
          $match: {
            course: { $in: courseIds },
          },
        },
        {
          $group: {
            _id: "$course",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),

      CoursePurchase.find(currentPurchaseMatch)
        .sort({ createdAt: -1 })
        .limit(8)
        .populate({
          path: "userId",
          select: "name photoUrl",
        })
        .populate({
          path: "courseId",
          select: "title thumbnail",
        })
        .lean(),
    ]);

    const reviewStatsMap = new Map(
      reviewStats.map((item) => [item._id.toString(), item]),
    );

    const totalReviews = reviewStats.reduce(
      (total, item) => total + item.totalReviews,
      0,
    );

    // Calculate a review-weighted rating across all instructor courses.
    const ratingSum = reviewStats.reduce(
      (total, item) => total + item.averageRating * item.totalReviews,
      0,
    );

    const averageRating =
      totalReviews > 0 ? roundToTwo(ratingSum / totalReviews) : 0;

    const salesMap = new Map(
      courseSales.map((item) => [item._id.toString(), item]),
    );

    const coursePerformance = courses
      .map((course) => {
        const sales = salesMap.get(course._id.toString());
        const rating = reviewStatsMap.get(course._id.toString());

        return {
          courseId: course._id,
          title: course.title,
          thumbnail: course.thumbnail || "",
          category: course.category,
          price: course.price,
          isPublished: course.isPublished,
          enrolledStudents: course.enrolledStudents?.length || 0,
          sales: sales?.sales || 0,
          revenue: roundToTwo(sales?.revenue || 0),
          averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0,
          totalReviews: rating?.totalReviews || 0,
        };
      })
      .sort(
        (a, b) =>
          b.revenue - a.revenue ||
          b.sales - a.sales ||
          b.enrolledStudents - a.enrolledStudents,
      );

    const revenueTrend = fillRevenueTrend(trendRows, range, currentStart, now);

    const recentSales = recentPurchases.map((purchase) => ({
      purchaseId: purchase._id,
      student: purchase.userId
        ? {
            name: purchase.userId.name,
            photoUrl: purchase.userId.photoUrl || "",
          }
        : null,
      course: purchase.courseId
        ? {
            courseId: purchase.courseId._id,
            title: purchase.courseId.title,
            thumbnail: purchase.courseId.thumbnail || "",
          }
        : null,
      amount: purchase.amount,
      purchasedAt: purchase.createdAt,
    }));

    const totalCourses = courses.length;
    const publishedCourses = courses.filter(
      (course) => course.isPublished,
    ).length;

    const overview = {
      totalRevenue: roundToTwo(currentSummary.revenue),
      totalSales: currentSummary.sales,
      totalStudents: currentSummary.students,
      averageRating,
      totalReviews,

      totalCourses,
      publishedCourses,
      draftCourses: totalCourses - publishedCourses,

      revenueChange: previousSummary
        ? calculatePercentageChange(
            currentSummary.revenue,
            previousSummary.revenue,
          )
        : null,

      salesChange: previousSummary
        ? calculatePercentageChange(currentSummary.sales, previousSummary.sales)
        : null,

      studentsChange: previousSummary
        ? calculatePercentageChange(
            currentSummary.students,
            previousSummary.students,
          )
        : null,
    };

    return res.status(200).json({
      success: true,
      range,
      overview,
      revenueTrend,
      coursePerformance,
      recentSales,
    });
  } catch (error) {
    console.error("Instructor dashboard analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load instructor dashboard analytics.",
    });
  }
};

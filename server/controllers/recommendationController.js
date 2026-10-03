import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Review } from "../models/review.model.js";

export const getRecommendedCourses = async (req, res) => {
  try {
    const userId = req.userId;

    // Get the logged-in user's enrolled courses.
    const user = await User.findById(userId).select("enrolledCourses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const enrolledCourseIds = user.enrolledCourses || [];

    let recommendedCourses = [];

    // 1. Personalized recommendations
    if (enrolledCourseIds.length > 0) {
      // Get categories from the user's enrolled courses.
      const enrolledCourses = await Course.find({
        _id: { $in: enrolledCourseIds },
      }).select("category");

      const categories = [
        ...new Set(
          enrolledCourses
            .map((course) => course.category?.trim())
            .filter(Boolean),
        ),
      ];

      if (categories.length > 0) {
        recommendedCourses = await Course.find({
          isPublished: true,
          _id: { $nin: enrolledCourseIds },
          category: { $in: categories },
        })
          .populate({
            path: "creator",
            select: "name photoUrl",
          })
          .populate({
            path: "lectures",
            select: "duration",
          });
      }
    }

    // 2. Fallback for students with no matching recommendations
    if (recommendedCourses.length === 0) {
      recommendedCourses = await Course.find({
        isPublished: true,
        _id: { $nin: enrolledCourseIds },
      })
        .populate({
          path: "creator",
          select: "name photoUrl",
        })
        .populate({
          path: "lectures",
          select: "duration",
        });
    }

    // Sort recommendations by enrollment count.
    // Newer courses are used as the tie-breaker.
    recommendedCourses.sort((a, b) => {
      const enrollmentDifference =
        (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0);

      if (enrollmentDifference !== 0) {
        return enrollmentDifference;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // 3. Fetch review statistics for recommended courses
    const courseIds = recommendedCourses.map((course) => course._id);

    let reviewStats = [];

    if (courseIds.length > 0) {
      reviewStats = await Review.aggregate([
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
      ]);
    }

    const reviewStatsMap = new Map(
      reviewStats.map((stat) => [
        stat._id.toString(),
        {
          averageRating: Number(stat.averageRating.toFixed(1)),
          totalReviews: stat.totalReviews,
        },
      ]),
    );

    // Attach review statistics to each course.
    const coursesWithReviews = recommendedCourses.map((course) => {
      const courseData = course.toObject();

      const stats = reviewStatsMap.get(course._id.toString());

      return {
        ...courseData,
        averageRating: stats?.averageRating ?? 0,
        totalReviews: stats?.totalReviews ?? 0,
      };
    });

    return res.status(200).json({
      success: true,
      courses: coursesWithReviews,
    });
  } catch (error) {
    console.error("Failed to fetch recommended courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommended courses.",
    });
  }
};

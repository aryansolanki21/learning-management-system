import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";

import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";

const getCloudinaryPublicIdFromUrl = (url) => {
  if (!url) {
    return null;
  }

  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);

  if (uploadIndex === -1) {
    return null;
  }

  let publicId = url.slice(uploadIndex + uploadMarker.length);

  // Remove the Cloudinary version segment, e.g. v1234567890/
  publicId = publicId.replace(/^v\d+\//, "");

  // Remove file extension.
  publicId = publicId.replace(/\.[^/.]+$/, "");

  return publicId || null;
};

// ==========  Course functions  =========================
export const createCourse = async (req, res) => {
  let uploadedThumbnailPublicId = null;

  try {
    const { title, subtitle, description, category, level, price } = req.body;

    const trimmedTitle = title?.trim();
    const trimmedSubtitle = subtitle?.trim() || "";
    const trimmedDescription = description?.trim() || "";
    const trimmedCategory = category?.trim();

    // Required fields
    if (!trimmedTitle || !trimmedCategory) {
      return res.status(400).json({
        success: false,
        message: "Course title and category are required.",
      });
    }

    // Validate course level when provided.
    const validLevels = ["Beginner", "Intermediate", "Advanced"];

    if (level && !validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course level.",
      });
    }

    // Price is optional; default to 0.
    const parsedPrice = price === undefined || price === "" ? 0 : Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number.",
      });
    }

    let thumbnailUrl = "";

    // Upload course thumbnail when provided.
    if (req.file) {
      if (!req.file.mimetype?.startsWith("image/")) {
        return res.status(400).json({
          success: false,
          message: "Course thumbnail must be an image.",
        });
      }

      const cloudResponse = await uploadMedia(req.file.path);

      if (!cloudResponse?.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload course thumbnail.",
        });
      }

      thumbnailUrl = cloudResponse.secure_url;
      uploadedThumbnailPublicId = cloudResponse.public_id || null;
    }

    const course = await Course.create({
      title: trimmedTitle,
      subtitle: trimmedSubtitle,
      description: trimmedDescription,
      category: trimmedCategory,
      level: level || undefined,
      price: parsedPrice,
      thumbnail: thumbnailUrl,
      creator: req.userId,

      // New courses start as drafts.
      isPublished: false,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    // If Cloudinary upload succeeded but database creation failed,
    // remove the uploaded thumbnail to avoid leaving an unused file.
    if (uploadedThumbnailPublicId) {
      try {
        await deleteMediaFromCloudinary(uploadedThumbnailPublicId);
      } catch (cleanupError) {
        console.error("Failed to clean up course thumbnail:", cleanupError);
      }
    }

    console.error("Course creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create course.",
    });
  }
};

export const getPublishedCourses = async (_, res) => {
  try {
    const courses = await Course.find({
      isPublished: true,
    })
      .populate({
        path: "creator",
        select: "name photoUrl",
      })
      .populate({
        path: "lectures",
        select: "duration",
      });

    // Fetch review statistics for all published courses in one query.
    const courseIds = courses.map((course) => course._id);

    const reviewStats = await Review.aggregate([
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

    // Map statistics by course ID for efficient lookup.
    const reviewStatsMap = new Map(
      reviewStats.map((stat) => [
        stat._id.toString(),
        {
          averageRating: Number(stat.averageRating.toFixed(1)),
          totalReviews: stat.totalReviews,
        },
      ]),
    );

    // Attach rating information to each course.
    const coursesWithReviews = courses.map((course) => {
      const courseData = course.toObject();

      const stats = reviewStatsMap.get(course._id.toString());

      return {
        ...courseData,
        averageRating: stats?.averageRating ?? 0,
        totalReviews: stats?.totalReviews ?? 0,
      };
    });

    // Sort by enrollment count; break ties using newer courses first.
    coursesWithReviews.sort((a, b) => {
      const enrollmentDifference =
        (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0);

      if (enrollmentDifference !== 0) {
        return enrollmentDifference;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      courses: coursesWithReviews,
    });
  } catch (error) {
    console.error("Failed to fetch published courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch published courses.",
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate({
      path: "creator",
      select: "name photoUrl",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully.",
      course,
    });
  } catch (error) {
    console.error("Failed to fetch course:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course.",
    });
  }
};

export const searchCourses = async (req, res) => {
  try {
    const {
      query = "",
      categories = "",
      sortByPrice = "",
      page = "1",
      limit = "10",
    } = req.query;

    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);

    const pageSize = Math.min(
      Math.max(Number.parseInt(limit, 10) || 10, 1),
      50,
    );

    const skip = (currentPage - 1) * pageSize;

    const categoryList = categories
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean);

    const searchQuery = {
      isPublished: true,
    };

    // Search by title, subtitle or category
    if (query.trim()) {
      const searchTerm = query.trim();

      searchQuery.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { subtitle: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Filter by category
    if (categoryList.length > 0) {
      searchQuery.category = {
        $in: categoryList,
      };
    }

    // Price sorting
    const sortOptions = {};

    if (sortByPrice === "low") {
      sortOptions.price = 1;
      sortOptions._id = 1;
    } else if (sortByPrice === "high") {
      sortOptions.price = -1;
      sortOptions._id = 1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Fetch paginated courses and total count together
    const [courses, totalCourses] = await Promise.all([
      Course.find(searchQuery)
        .populate({
          path: "creator",
          select: "name photoUrl",
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize),

      Course.countDocuments(searchQuery),
    ]);

    // Get review statistics only for courses on the current page.
    const courseIds = courses.map((course) => course._id);

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
            averageRating: {
              $avg: "$rating",
            },
            totalReviews: {
              $sum: 1,
            },
          },
        },
      ]);
    }

    // Map review statistics by course ID
    const reviewStatsMap = new Map(
      reviewStats.map((stat) => [
        stat._id.toString(),
        {
          averageRating: Number(stat.averageRating.toFixed(1)),
          totalReviews: stat.totalReviews,
        },
      ]),
    );

    // Attach review statistics to each course
    const coursesWithReviews = courses.map((course) => {
      const courseData = course.toObject();

      const stats = reviewStatsMap.get(course._id.toString());

      return {
        ...courseData,
        averageRating: stats?.averageRating ?? 0,
        totalReviews: stats?.totalReviews ?? 0,
      };
    });

    const totalPages = Math.ceil(totalCourses / pageSize);

    return res.status(200).json({
      success: true,
      courses: coursesWithReviews,
      pagination: {
        currentPage,
        pageSize,
        totalCourses,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Course search error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search courses.",
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ creator: req.userId })
      .select(
  "title subtitle category level price thumbnail lectures isPublished createdAt",
)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Failed to fetch creator courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const { title, subtitle, description, category, level, price } = req.body;

    const thumbnail = req.file;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Ensure only the course creator can edit the course.
    if (course.creator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this course.",
      });
    }

    const updateData = {};

    if (title?.trim()) {
      updateData.title = title.trim();
    }

    if (subtitle !== undefined) {
      updateData.subtitle = subtitle.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (category?.trim()) {
      updateData.category = category.trim();
    }

    if (level !== undefined) {
      updateData.level = level;
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid non-negative number.",
        });
      }

      updateData.price = parsedPrice;
    }

    let oldThumbnailPublicId = null;

    if (thumbnail) {
      const cloudResponse = await uploadMedia(thumbnail.path);

      if (!cloudResponse?.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload course thumbnail.",
        });
      }

      updateData.thumbnail = cloudResponse.secure_url;

      if (course.thumbnail) {
        oldThumbnailPublicId = course.thumbnail.split("/").pop().split(".")[0];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No course data provided for update.",
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    );

    if (oldThumbnailPublicId) {
      await deleteMediaFromCloudinary(oldThumbnailPublicId);
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Course update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update course.",
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required.",
      });
    }

    // Fetch course and verify ownership.
    const course = await Course.findById(courseId).select(
      "creator thumbnail lectures",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    if (course.creator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this course.",
      });
    }

    // Get lecture videos before deleting the lecture documents.
    const lectures = await Lecture.find({
      course: courseId,
    }).select("publicId");

    const lectureVideoPublicIds = lectures
      .map((lecture) => lecture.publicId)
      .filter(Boolean);

    // Get course thumbnail public ID before deleting the course.
    const thumbnailPublicId = getCloudinaryPublicIdFromUrl(
      course.thumbnail,
    );

    /*
     * Remove database references.
     *
     * CoursePurchase is intentionally NOT deleted.
     * It is useful for preserving historical sales/revenue records.
     */
    await Promise.all([
      Lecture.deleteMany({
        course: courseId,
      }),

      Review.deleteMany({
        course: courseId,
      }),

      CourseProgress.deleteMany({
        courseId,
      }),

      User.updateMany(
        {
          enrolledCourses: courseId,
        },
        {
          $pull: {
            enrolledCourses: courseId,
          },
        },
      ),
    ]);

    // Finally remove the course itself.
    await Course.findByIdAndDelete(courseId);

    /*
     * Clean up Cloudinary files after successful database deletion.
     *
     * Media cleanup failure should not make the API report that
     * the course was not deleted because the database operation
     * has already completed.
     */
    if (thumbnailPublicId) {
      try {
        await deleteMediaFromCloudinary(thumbnailPublicId);
      } catch (cleanupError) {
        console.error(
          "Failed to delete course thumbnail from Cloudinary:",
          cleanupError,
        );
      }
    }

    for (const publicId of lectureVideoPublicIds) {
      try {
        await deleteVideoFromCloudinary(publicId);
      } catch (cleanupError) {
        console.error(
          `Failed to delete lecture video ${publicId} from Cloudinary:`,
          cleanupError,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully.",
    });
  } catch (error) {
    console.error("Course deletion error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete course.",
    });
  }
};

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query;

    if (publish !== "true" && publish !== "false") {
      return res.status(400).json({
        success: false,
        message: "Publish value must be either true or false.",
      });
    }

    const course = await Course.findById(courseId).select(
      "creator isPublished",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    if (course.creator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this course.",
      });
    }

    course.isPublished = publish === "true";

    await course.save();

    return res.status(200).json({
      success: true,
      message: course.isPublished
        ? "Course published successfully."
        : "Course unpublished successfully.",
      course,
    });
  } catch (error) {
    console.error("Course publish status update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update course publish status.",
    });
  }
};

// ==========  Lecture functions  =========================
export const createLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;

    if (!courseId || !title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course ID and lecture title are required.",
      });
    }

    const course = await Course.findById(courseId).select("creator lectures");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    if (course.creator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this course.",
      });
    }

    const lecture = await Lecture.create({
      course: courseId,
      title: title.trim(),
    });

    course.lectures.push(lecture._id);
    await course.save();

    return res.status(201).json({
      success: true,
      message: "Lecture created successfully.",
      lecture,
    });
  } catch (error) {
    console.error("Lecture creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lecture.",
    });
  }
};

export const getCourseLectures = async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseExists = await Course.exists({ _id: courseId });

    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const lectures = await Lecture.find({ course: courseId }).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      lectures,
    });
  } catch (error) {
    console.error("Failed to fetch course lectures:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lectures.",
    });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    const { title, videoInfo, isPreviewFree } = req.body;

    const course = await Course.findById(courseId).select("creator lectures");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    if (course.creator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this course.",
      });
    }

    const lecture = await Lecture.findOne({
      _id: lectureId,
      course: courseId,
    });

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found in this course.",
      });
    }

    const oldVideoPublicId = lecture.publicId || null;

    if (title?.trim()) {
      lecture.title = title.trim();
    }

    if (videoInfo?.videoUrl !== undefined) {
      lecture.videoUrl = videoInfo.videoUrl;
    }

    if (videoInfo?.publicId !== undefined) {
      lecture.publicId = videoInfo.publicId;
    }

    if (videoInfo?.duration !== undefined) {
      const duration = Number(videoInfo.duration);

      if (!Number.isFinite(duration) || duration < 0) {
        return res.status(400).json({
          success: false,
          message: "Lecture duration must be a valid non-negative number.",
        });
      }

      lecture.duration = duration;
    }

    if (typeof isPreviewFree === "boolean") {
      lecture.isPreviewFree = isPreviewFree;
    }

    await lecture.save();

    // Remove the old Cloudinary video only after the new lecture
    // information has been saved successfully.
    const newVideoPublicId = lecture.publicId || null;

    if (
      oldVideoPublicId &&
      newVideoPublicId &&
      oldVideoPublicId !== newVideoPublicId
    ) {
      try {
        await deleteVideoFromCloudinary(oldVideoPublicId);
      } catch (cleanupError) {
        console.error(
          "Failed to remove old lecture video from Cloudinary:",
          cleanupError,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lecture updated successfully.",
      lecture,
    });
  } catch (error) {
    console.error("Lecture update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update lecture.",
    });
  }
};

export const removeLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    const course = await Course.findById(courseId).select("creator lectures");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    if (course.creator.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this course.",
      });
    }

    const lecture = await Lecture.findOne({ _id: lectureId, course: courseId });

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found in this course.",
      });
    }

    await lecture.deleteOne();

    course.lectures.pull(lectureId);
    await course.save();

    // Delete the lecture video from Cloudinary
    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    return res.status(200).json({
      success: true,
      message: "Lecture removed successfully.",
    });
  } catch (error) {
    console.error("Lecture deletion error:", error);

    return res.status(500).json({
      message: "Failed to remove lecture",
    });
  }
};

import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";

// ==========  Course functions  =========================
export const createCourse = async (req, res) => {
  try {
    const { title, category } = req.body;

    if (!title?.trim() || !category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course title and category are required.",
      });
    }

    const course = await Course.create({
      title: title.trim(),
      category: category.trim(),
      creator: req.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
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
    }).populate({
      path: "creator",
      select: "name photoUrl",
    });

    return res.status(200).json({
      success: true,
      courses,
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

    const searchQuery  = {
      isPublished: true,
    };

    if (query.trim()) {
       const searchTerm = query.trim();

      searchQuery.$or = [
        { title: { $regex: query.trim(), $options: "i" } },
        { subtitle: { $regex: query.trim(), $options: "i" } },
        { category: { $regex: query.trim(), $options: "i" } },
      ];
    }

    if (categoryList.length > 0) {
      searchQuery.category = {
        $in: categoryList,
      };
    }

    const sortOptions = {
      createdAt: -1,
    };

    if (sortByPrice === "low") {
      sortOptions.price = 1;
      sortOptions._id = 1;
    } else if (sortByPrice === "high") {
      sortOptions.price = -1;
      sortOptions._id = 1;
    }

    const [courses, totalCourses] = await Promise.all([
      Course.find(searchQuery )
        .populate({
          path: "creator",
          select: "name photoUrl",
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize),

      Course.countDocuments(searchQuery),
    ]);

    const totalPages = Math.ceil(totalCourses / pageSize);

    return res.status(200).json({
      success: true,
      courses,
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
        "title subtitle category level price thumbnail isPublished createdAt",
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

export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found.",
      });
    }

    return res.status(200).json({
      success: true,
      lecture,
    });
  } catch (error) {
    console.error("Failed to fetch lecture:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lecture.",
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

    if (title?.trim()) {
      lecture.title = title.trim();
    }

    if (videoInfo?.videoUrl !== undefined) {
      lecture.videoUrl = videoInfo.videoUrl;
    }

    if (videoInfo?.publicId !== undefined) {
      lecture.publicId = videoInfo.publicId;
    }

    if (typeof isPreviewFree === "boolean") {
      lecture.isPreviewFree = isPreviewFree;
    }

    await lecture.save();

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
    const { lectureId, courseId } = req.params;

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

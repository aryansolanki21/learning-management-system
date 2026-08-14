import { Course } from "../models/Course.js";
import { CourseProgress } from "../models/CourseProgress.js";

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    const courseDetails = await Course.findById(courseId).populate("lectures");

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    if (!courseProgress) {
      return res.status(200).json({
        data: {
          courseDetails,
          progress: [],
          completed: false,
        },
      });
    }

    return res.status(200).json({
      data: {
        courseDetails,
        progress: courseProgress.lectureProgress,
        completed: courseProgress.completed,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get course progress.",
    });
  }
};

export const updateLectureProgress = async (req, res) => {
  try {
    const { lectureId, courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    const lectureExists = course.lectures.some(
      (lecture) => lecture.toString() === lectureId,
    );

    if (!lectureExists) {
      return res.status(404).json({
        success: false,
        message: "Lecture does not belong to this course.",
      });
    }

    let progress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    if (!progress) {
      progress = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lectureProgress: [],
      });
    }

    const lectureIndex = progress.lectureProgress.findIndex(
      (lecture) => lecture.lectureId.toString() === lectureId,
    );

    if (lectureIndex !== -1) {
      progress.lectureProgress[lectureIndex].viewed = true;
    } else {
      progress.lectureProgress.push({
        lectureId,
        viewed: true,
      });
    }

    const lectureProgressLength = progress.lectureProgress.filter(
      (lectureProg) => lectureProg.viewed,
    ).length;

    progress.completed = course.lectures.length === lectureProgressLength;

    await progress.save();

    return res.status(200).json({
      success: true,
      progress,
      message: "Lecture Progress updated successfully",
    });
  } catch (error) {
    console.error("Update lecture progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    if (!courseProgress)
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });

    courseProgress.lectureProgress.forEach(
      (lectureProgress) => (lectureProgress.viewed = true),
    );

    courseProgress.completed = true;

    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Course marked as completed.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markAsInCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    if (!courseProgress)
      return res.status(404).json({ message: "Course progress not found" });

    courseProgress.lectureProgress.forEach(
      (lectureProgress) => (lectureProgress.viewed = false),
    );

    courseProgress.completed = false;

    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Course marked as incomplete.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

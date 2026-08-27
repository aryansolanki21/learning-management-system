import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    videoUrl: {
      type: String,
    },

    publicId: {
      type: String,
    },

    isPreviewFree: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Lecture = mongoose.model("Lecture", lectureSchema);

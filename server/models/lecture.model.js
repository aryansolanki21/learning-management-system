import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
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

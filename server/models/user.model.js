import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    emailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerificationOtpHash: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    emailVerificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    emailVerificationLastSentAt: {
      type: Date,
      default: null,
      select: false,
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
    },

    role: {
      type: String,
      enum: ["instructor", "student"],
      default: "student",
    },

    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    photoUrl: {
      type: String,
      default: "",
    },

    refreshTokenHash: {
      type: String,
      default: null,
    },

    refreshTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);

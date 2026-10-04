import CourseBasicInfoForm from "./CourseBasicInfoForm.jsx";

import {
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Video,
  ArrowLeft,
  Eye,
} from "lucide-react";

import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import {
  useCreateLectureMutation,
  useEditCourseMutation,
  useEditLectureMutation,
  useGetCourseByIdQuery,
  useGetCourseLecturesQuery,
  usePublishCourseMutation,
  useRemoveLectureMutation,
} from "@/features/api/courseApi.js";

import { Badge as BadgeComponent } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Progress } from "@/components/ui/progress.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import { toast } from "@/components/ui/toast.jsx";

import { formatDuration } from "@/utils/formatDuration.js";

const MEDIA_API = "http://localhost:8080/api/v1/media";

const emptyLectureForm = {
  title: "",
  videoFile: null,
  isPreviewFree: false,
  editingId: null,
  existingVideoUrl: "",
};

const CourseBuilder = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const {
    data: courseData,
    isLoading: courseLoading,
    isError: courseError,
    refetch: refetchCourse,
  } = useGetCourseByIdQuery(courseId, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: lectureData,
    isLoading: lectureLoading,
    isError: lectureError,
    refetch: refetchLectures,
  } = useGetCourseLecturesQuery(courseId);

  const [editCourse, { isLoading: courseSaving }] = useEditCourseMutation();

  const [createLecture, { isLoading: lectureCreating }] =
    useCreateLectureMutation();

  const [editLecture, { isLoading: lectureUpdating }] =
    useEditLectureMutation();

  const [removeLecture, { isLoading: lectureRemoving }] =
    useRemoveLectureMutation();

  const [publishCourse, { isLoading: publishLoading }] =
    usePublishCourseMutation();

  const [input, setInput] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    level: "",
    price: "",
    thumbnail: null,
  });

  const [existingThumbnail, setExistingThumbnail] = useState("");
  const [previewThumbnail, setPreviewThumbnail] = useState("");

  const [showLectureForm, setShowLectureForm] = useState(false);
  const [lectureForm, setLectureForm] = useState(emptyLectureForm);

  const [mediaProgress, setMediaProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const course = courseData?.course;
  const lectures = lectureData?.lectures || [];

  useEffect(() => {
    if (!course) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInput({
      title: course.title ?? "",
      subtitle: course.subtitle ?? "",
      description: course.description ?? "",
      category: course.category ?? "",
      level: course.level ?? "",
      price:
        course.price !== undefined && course.price !== null
          ? String(course.price)
          : "",
      thumbnail: null,
    });

    setExistingThumbnail(course.thumbnail ?? "");
    setPreviewThumbnail("");
  }, [course]);

  const resetLectureForm = () => {
    setLectureForm(emptyLectureForm);
    setShowLectureForm(false);
    setMediaProgress(false);
    setUploadProgress(0);
  };

  const startAddLecture = () => {
    setLectureForm(emptyLectureForm);
    setShowLectureForm(true);
  };

  const startEditLecture = (lecture) => {
    setLectureForm({
      title: lecture.title ?? "",
      videoFile: null,
      isPreviewFree: lecture.isPreviewFree ?? false,
      editingId: lecture._id,
      existingVideoUrl: lecture.videoUrl ?? "",
    });

    setShowLectureForm(true);
  };

  const handleLectureFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.add({
        type: "error",
        title: "Invalid video",
        description: "Please select a valid video file.",
      });

      event.target.value = "";
      return;
    }

    setLectureForm((previous) => ({
      ...previous,
      videoFile: file,
    }));
  };

  const uploadVideo = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    setMediaProgress(true);
    setUploadProgress(0);

    try {
      const response = await axios.post(`${MEDIA_API}/upload-video`, formData, {
        withCredentials: true,
        onUploadProgress: ({ loaded, total }) => {
          if (total) {
            setUploadProgress(Math.round((loaded * 100) / total));
          }
        },
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || "Video upload failed.");
      }

      return {
        videoUrl: response.data.data.url,
        publicId: response.data.data.public_id,
        duration: response.data.data.duration || 0,
      };
    } catch (error) {
      console.error("Failed to upload lecture video:", error);

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload lecture video.",
        {
          cause: error,
        },
      );
    } finally {
      setMediaProgress(false);
    }
  };

  const handleSaveCourse = async (event) => {
    event.preventDefault();

    const title = input.title.trim();
    const subtitle = input.subtitle.trim();
    const description = input.description.trim();

    if (!title) {
      toast.add({
        type: "error",
        title: "Course title is required.",
      });
      return;
    }

    if (!input.category) {
      toast.add({
        type: "error",
        title: "Course category is required.",
      });
      return;
    }

    if (input.price !== "") {
      const price = Number(input.price);

      if (!Number.isFinite(price) || price < 0) {
        toast.add({
          type: "error",
          title: "Invalid course price.",
          description: "Price must be zero or greater.",
        });
        return;
      }
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("description", description);
    formData.append("category", input.category);
    formData.append("level", input.level);
    formData.append("price", input.price);

    if (input.thumbnail instanceof File) {
      formData.append("thumbnail", input.thumbnail);
    }

    try {
      const response = await editCourse({
        formData,
        courseId,
      }).unwrap();

      toast.add({
        type: "success",
        title: response?.message || "Course updated successfully.",
      });

      await refetchCourse();
    } catch (error) {
      console.error("Failed to update course:", error);

      toast.add({
        type: "error",
        title: "Failed to update course.",
        description:
          error?.data?.message ||
          "Please check your course information and try again.",
      });
    }
  };

  const handleSaveLecture = async (event) => {
    event.preventDefault();

    const title = lectureForm.title.trim();

    if (!title) {
      toast.add({
        type: "error",
        title: "Lecture title is required.",
      });
      return;
    }

    // New lectures should be complete from the builder.
    if (!lectureForm.editingId && !lectureForm.videoFile) {
      toast.add({
        type: "error",
        title: "Lecture video is required.",
        description: "Please upload a video before adding the lecture.",
      });
      return;
    }

    try {
      let videoInfo;

      // Upload a new video only when the instructor selected one.
      if (lectureForm.videoFile) {
        videoInfo = await uploadVideo(lectureForm.videoFile);
      }

      if (lectureForm.editingId) {
        await editLecture({
          title,
          videoInfo,
          isPreviewFree: lectureForm.isPreviewFree,
          courseId,
          lectureId: lectureForm.editingId,
        }).unwrap();

        toast.add({
          type: "success",
          title: "Lecture updated successfully.",
        });
      } else {
        const response = await createLecture({
          title,
          courseId,
        }).unwrap();

        const createdLectureId = response?.lecture?._id;

        if (!createdLectureId) {
          throw new Error("Lecture was created but its ID was not returned.");
        }

        await editLecture({
          title,
          videoInfo,
          isPreviewFree: lectureForm.isPreviewFree,
          courseId,
          lectureId: createdLectureId,
        }).unwrap();

        toast.add({
          type: "success",
          title: "Lecture added successfully.",
        });
      }

      await refetchLectures();
      await refetchCourse();
      resetLectureForm();
    } catch (error) {
      console.error("Failed to save lecture:", error);

      toast.add({
        type: "error",
        title: lectureForm.editingId
          ? "Failed to update lecture."
          : "Failed to add lecture.",
        description:
          error?.data?.message || error?.message || "Please try again.",
      });
    }
  };

  const handleRemoveLecture = async (lectureId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this lecture?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await removeLecture({
        courseId,
        lectureId,
      }).unwrap();

      toast.add({
        type: "success",
        title: "Lecture removed successfully.",
      });

      if (lectureForm.editingId === lectureId) {
        resetLectureForm();
      }

      await refetchLectures();
      await refetchCourse();
    } catch (error) {
      console.error("Failed to remove lecture:", error);

      toast.add({
        type: "error",
        title: "Failed to remove lecture.",
        description: error?.data?.message || "Please try again.",
      });
    }
  };

  const publishStatusHandler = async () => {
    if (lectures.length === 0) {
      toast.add({
        type: "error",
        title: "Add at least one lecture.",
        description:
          "The course needs lecture content before it can be published.",
      });
      return;
    }

    const nextPublishState = course?.isPublished ? "false" : "true";

    try {
      const response = await publishCourse({
        courseId,
        query: nextPublishState,
      }).unwrap();

      toast.add({
        type: "success",
        title: response?.message || "Course status updated.",
      });

      await refetchCourse();
    } catch (error) {
      console.error("Failed to publish course:", error);

      toast.add({
        type: "error",
        title: "Unable to update course status.",
        description:
          error?.data?.message ||
          "Please complete the course content and try again.",
      });
    }
  };

  if (courseLoading || lectureLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center p-10 text-center">
            <h2 className="text-xl font-semibold">Unable to load course</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              The course could not be loaded.
            </p>

            <Button className="mt-5" onClick={() => navigate("/admin/course")}>
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSavingLecture = lectureCreating || lectureUpdating;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Builder Header */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="mt-1 shrink-0 rounded-full"
            onClick={() => navigate("/admin/course")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <p className="text-sm text-muted-foreground">Course Builder</p>

            <h1 className="text-2xl font-bold tracking-tight">
              {course.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BadgeComponent
                variant={course.isPublished ? "default" : "secondary"}
              >
                {course.isPublished ? "Published" : "Draft"}
              </BadgeComponent>

              <span className="text-sm text-muted-foreground">
                {lectures.length}{" "}
                {lectures.length === 1 ? "lecture" : "lectures"}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant={course.isPublished ? "outline" : "default"}
          disabled={
            publishLoading || (!course.isPublished && lectures.length === 0)
          }
          onClick={publishStatusHandler}
        >
          {publishLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : course.isPublished ? (
            "Unpublish Course"
          ) : (
            "Publish Course"
          )}
        </Button>
      </div>

      {/* Course Information */}
      <CourseBasicInfoForm
        input={input}
        setInput={setInput}
        previewThumbnail={previewThumbnail}
        setPreviewThumbnail={setPreviewThumbnail}
        existingThumbnail={existingThumbnail}
        isSubmitting={courseSaving}
        onSubmit={handleSaveCourse}
        onCancel={() => navigate("/admin/course")}
        submitLabel="Save Course Changes"
        submittingLabel="Saving..."
      />

      {/* Curriculum */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Course Curriculum</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Add lectures, upload videos, and configure free previews without
              leaving the course builder.
            </p>
          </div>

          {!showLectureForm && (
            <Button onClick={startAddLecture}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lecture
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Lecture editor */}
          {showLectureForm && (
            <Card className="border-blue-200 bg-blue-50/40">
              <CardHeader>
                <CardTitle className="text-lg">
                  {lectureForm.editingId ? "Edit Lecture" : "Add New Lecture"}
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  {lectureForm.editingId
                    ? "Update the lecture information or replace its video."
                    : "Add the lecture title and upload its video before saving."}
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSaveLecture} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="lecture-title">
                      Lecture Title <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      id="lecture-title"
                      value={lectureForm.title}
                      onChange={(event) =>
                        setLectureForm((previous) => ({
                          ...previous,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Ex. Introduction to JavaScript"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lecture-video">
                      Video{" "}
                      {!lectureForm.editingId && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>

                    <Input
                      id="lecture-video"
                      type="file"
                      accept="video/*"
                      onChange={handleLectureFileChange}
                    />

                    {lectureForm.videoFile && (
                      <p className="text-xs text-gray-600">
                        Selected:{" "}
                        <span className="font-medium">
                          {lectureForm.videoFile.name}
                        </span>
                      </p>
                    )}

                    {lectureForm.editingId &&
                      !lectureForm.videoFile &&
                      lectureForm.existingVideoUrl && (
                        <div className="flex items-center gap-2 text-xs text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Existing video is uploaded. Leave this field empty to
                          keep it.
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="lecture-preview-free"
                      checked={lectureForm.isPreviewFree}
                      onCheckedChange={(checked) =>
                        setLectureForm((previous) => ({
                          ...previous,
                          isPreviewFree: checked,
                        }))
                      }
                    />

                    <Label htmlFor="lecture-preview-free">
                      Allow this lecture as a free preview
                    </Label>
                  </div>

                  {mediaProgress && (
                    <div className="space-y-2 rounded-lg border bg-white p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading video...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>

                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSavingLecture || mediaProgress}
                      onClick={resetLectureForm}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSavingLecture || mediaProgress}
                    >
                      {isSavingLecture || mediaProgress ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Please wait
                        </>
                      ) : lectureForm.editingId ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Update Lecture
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Lecture
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {lectureError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <p className="text-sm text-red-600">Failed to load lectures.</p>

              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => refetchLectures()}
              >
                Try Again
              </Button>
            </div>
          ) : lectures.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Video className="mx-auto h-10 w-10 text-gray-400" />

              <h3 className="mt-3 font-semibold">No lectures yet</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Start building your curriculum by adding your first lecture.
              </p>

              {!showLectureForm && (
                <Button className="mt-5" onClick={startAddLecture}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Lecture
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {lectures.map((lecture, index) => (
                <div
                  key={lecture._id}
                  className="rounded-xl border bg-white p-4 transition hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {lecture.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <BadgeComponent variant="outline">
                            {formatDuration(lecture.duration)}
                          </BadgeComponent>

                          {lecture.videoUrl ? (
                            <BadgeComponent className="bg-green-100 text-green-700 hover:bg-green-100">
                              <Video className="mr-1 h-3 w-3" />
                              Video Ready
                            </BadgeComponent>
                          ) : (
                            <BadgeComponent
                              variant="outline"
                              className="border-amber-300 text-amber-700"
                            >
                              <Upload className="mr-1 h-3 w-3" />
                              Video Missing
                            </BadgeComponent>
                          )}

                          {lecture.isPreviewFree && (
                            <BadgeComponent
                              variant="outline"
                              className="border-blue-300 text-blue-700"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Free Preview
                            </BadgeComponent>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEditLecture(lecture)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={lectureRemoving}
                        onClick={() => handleRemoveLecture(lecture._id)}
                      >
                        {lectureRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseBuilder;

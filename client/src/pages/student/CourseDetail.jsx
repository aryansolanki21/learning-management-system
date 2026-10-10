import BuyCourseButton from "@/components/BuyCourseButton.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Separator } from "@/components/ui/separator.jsx";

import { formatDuration } from "@/utils/formatDuration.js";
import { useGetCourseDetailWithPurchaseStatusQuery } from "@/features/api/purchaseApi.js";

import ReactPlayer from "react-player";
import { ArrowLeft, BadgeInfo, BookOpen, Lock, PlayCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CourseReviews from "./CourseReviews.jsx";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } =
    useGetCourseDetailWithPurchaseStatusQuery(courseId);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-64 w-full min-w-0 max-w-7xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">
          Loading course details...
        </p>
      </div>
    );
  }

  if (isError || !data?.course) {
    return (
      <div className="mx-auto flex min-h-64 w-full min-w-0 max-w-7xl flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-500">Failed to load course details.</p>

        <Button variant="outline" onClick={() => navigate("/course/search")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Browse Courses
        </Button>
      </div>
    );
  }

  const { course, isPurchased } = data || {};

  const lectures = course.lectures || [];
  const previewLecture = lectures[0];

  const handleContinueCourse = () => {
    if (isPurchased) {
      navigate(`/course-progress/${courseId}`);
    }
  };

  const updatedDate = course.updatedAt
    ? new Date(course.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      {/* Course header */}
      <section className="w-full min-w-0 bg-[#2D2F31] text-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-3 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>

          {course.subtitle && (
            <p className="break-words text-sm leading-6 text-gray-200 sm:text-base lg:text-lg">
              {course.subtitle}
            </p>
          )}

          <p className="break-words text-sm sm:text-base">
            Created by{" "}
            <span className="font-medium italic text-[#C0C4FC] underline">
              {course.creator?.name || "Instructor"}
            </span>
          </p>

          {updatedDate && (
            <div className="flex min-w-0 items-start gap-2 text-sm text-gray-200">
              <BadgeInfo className="mt-0.5 h-4 w-4 shrink-0" />

              <p className="min-w-0 break-words">Last updated {updatedDate}</p>
            </div>
          )}

          <p className="text-sm text-gray-200 sm:text-base">
            Students enrolled: {course.enrolledStudents?.length || 0}
          </p>
        </div>
      </section>

      {/* Main course layout */}
      <div className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-start gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] lg:gap-10 lg:px-8">
        {/* Course description and curriculum */}
        <section className="w-full min-w-0 space-y-6">
          <div className="min-w-0 space-y-3">
            <h2 className="text-xl font-bold sm:text-2xl">Description</h2>

            <div
              className="min-w-0 break-words text-sm leading-6 [overflow-wrap:anywhere] sm:text-base"
              dangerouslySetInnerHTML={{
                __html:
                  course.description || "No course description available.",
              }}
            />
          </div>

          <Card className="w-full min-w-0 overflow-hidden">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle>Course Content</CardTitle>

              <CardDescription>
                {lectures.length}{" "}
                {lectures.length === 1 ? "lecture" : "lectures"}
              </CardDescription>
            </CardHeader>

            <CardContent className="min-w-0 space-y-4 px-4 sm:px-6">
              {lectures.length > 0 ? (
                lectures.map((lecture, index) => (
                  <div
                    key={lecture._id}
                    className="flex min-w-0 items-start gap-3 text-sm"
                  >
                    <span className="mt-0.5 shrink-0">
                      {isPurchased || index === 0 ? (
                        <PlayCircle
                          className="h-4 w-4"
                          aria-label="Available lecture"
                        />
                      ) : (
                        <Lock
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Locked lecture"
                        />
                      )}
                    </span>

                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 break-words leading-5 [overflow-wrap:anywhere]">
                        {lecture.title}
                      </p>

                      <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                        {formatDuration(lecture.duration)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <p>No lectures available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Preview and purchase card */}
        <aside className="w-full min-w-0 lg:sticky lg:top-24 lg:self-start">
          <Card className="w-full min-w-0 overflow-hidden shadow-sm">
            <CardContent className="min-w-0 p-4 sm:p-5">
              {/* Responsive video container */}
              <div className="relative mb-4 aspect-video w-full min-w-0 overflow-hidden rounded-md bg-black">
                {previewLecture?.videoUrl ? (
                  <ReactPlayer
                    width="100%"
                    height="100%"
                    src={previewLecture.videoUrl}
                    controls
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-4 text-center">
                    <p className="text-sm text-gray-300">
                      No preview available
                    </p>
                  </div>
                )}
              </div>

              <h2 className="break-words font-semibold [overflow-wrap:anywhere]">
                {previewLecture?.title || "No lecture available"}
              </h2>

              <Separator className="my-4" />

              <div className="flex min-w-0 items-baseline justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Course price
                </span>

                <span className="break-words text-right text-lg font-bold sm:text-xl">
                  {Number(course.price) > 0
                    ? `₹${Number(course.price).toLocaleString("en-IN")}`
                    : "Free"}
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex w-full min-w-0 p-4 pt-0 sm:p-5 sm:pt-0">
              {isPurchased ? (
                <Button
                  onClick={handleContinueCourse}
                  className="w-full min-w-0"
                >
                  Continue Course
                </Button>
              ) : (
                <div className="w-full min-w-0">
                  <BuyCourseButton courseId={courseId} />
                </div>
              )}
            </CardFooter>
          </Card>
        </aside>
      </div>

      {/* Reviews */}
      <section className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
        <CourseReviews courseId={courseId} isPurchased={isPurchased} />
      </section>
    </div>
  );
};

export default CourseDetail;

import BuyCourseButton from "@/components/BuyCourseButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator.jsx";

import { formatDuration } from "@/utils/formatDuration";
import { useGetCourseDetailWithPurchaseStatusQuery } from "@/features/api/purchaseApi.js";

import ReactPlayer from "react-player";
import { BadgeInfo, Lock, PlayCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const CourseDetail = () => {
  const params = useParams();
  const courseId = params.courseId;
  const navigate = useNavigate();

  const { data, isLoading, isError } =
    useGetCourseDetailWithPurchaseStatusQuery(courseId);

  if (isLoading) return <h1>Loading...</h1>;

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <p className="text-red-500">Failed to load course details.</p>
      </div>
    );
  }

  const { course, isPurchased } = data || {};

  const handleContinueCourse = () => {
    if (isPurchased) {
      navigate(`/course-progress/${courseId}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#2D2F31] text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-2">
          <h1 className="font-bold text-2xl md:text-3xl">{course?.title}</h1>
          <p className="text-base md:text-lg">{course?.title}</p>
          <p>
            Created By{" "}
            <span className="text-[#C0C4FC] underline italic">
              {course?.creator?.name}
            </span>
          </p>
          <div className="flex items-center gap-2 text-sm">
            <BadgeInfo size={16} />
            <p>Last updated {course?.updatedAt?.split("T")[0]}</p>
          </div>
          <p>Students enrolled: {course?.enrolledStudents?.length || 0}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto my-5 px-4 md:px-8 flex flex-col lg:flex-row justify-between gap-10">
        {/* Left Section */}
        <div className="w-full lg:w-1/2 space-y-5">
          <h1 className="font-bold text-xl md:text-2xl">Description</h1>
          <p
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: course?.description || "" }}
          />
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>
                {course?.lectures?.length || 0} lectures
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {course?.lectures?.length > 0 ? (
                course.lectures.map((lecture, idx) => (
                  <div
                    key={lecture._id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span>
                      {isPurchased || idx === 0 ? (
                        <PlayCircle size={14} />
                      ) : (
                        <Lock size={14} />
                      )}
                    </span>

                    <div className="flex-1 flex items-center justify-between">
                      <p>{lecture.title}</p>

                      <span className="text-xs text-gray-500">
                        {formatDuration(lecture.duration)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No lectures available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section */}
        <div className="w-full lg:w-1/3">
          <Card>
            <CardContent className="p-4 flex flex-col">
              {/* Video */}
              <div className="w-full aspect-video mb-4">
                {course?.lectures?.length > 0 &&
                course.lectures[0]?.videoUrl ? (
                  <ReactPlayer
                    width="100%"
                    height="100%"
                    src={course.lectures[0].videoUrl}
                    controls={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">
                      No preview available
                    </p>
                  </div>
                )}
              </div>

              {/* Lecture Title */}
              <h1 className="font-semibold">
                {course?.lectures?.length > 0
                  ? course.lectures[0].title
                  : "No lecture available"}
              </h1>
              <Separator className="my-2" />

              {/* Price */}
              <h1 className="text-lg md:text-xl font-semibold">
                Course Price: ₹{course?.price}
              </h1>
            </CardContent>

            {/* Button */}
            <CardFooter className="flex justify-center p-4">
              {isPurchased ? (
                <Button onClick={handleContinueCourse} className="w-full">
                  Continue Course
                </Button>
              ) : (
                <BuyCourseButton courseId={courseId} />
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

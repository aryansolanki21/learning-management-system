import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast.jsx";

import {
  useCompleteCourseMutation,
  useGetCourseProgressQuery,
  useIncompleteCourseMutation,
  useUpdateLectureProgressMutation,
} from "@/features/api/courseProgressApi.js";

import { formatDuration } from "@/utils/formatDuration";

import { CheckCircle, CheckCircle2, CirclePlay } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const CourseProgress = () => {
  const params = useParams();
  const courseId = params.courseId;

  const { data, isLoading, isError } = useGetCourseProgressQuery(courseId);

  const [updateLectureProgress] = useUpdateLectureProgressMutation();

  const [
    completeCourse,
    { data: markCompleteData, isSuccess: completedSuccess },
  ] = useCompleteCourseMutation();

  const [
    incompleteCourse,
    { data: markInCompleteData, isSuccess: inCompletedSuccess },
  ] = useIncompleteCourseMutation();

  const [currentLecture, setCurrentLecture] = useState(null);

  useEffect(() => {
    if (completedSuccess) {
      toast.add({
        title: "Success",
        description: markCompleteData.message,
      });
    }

    if (inCompletedSuccess) {
      toast.add({
        title: "Success",
        description: markInCompleteData.message,
      });
    }
  }, [
    completedSuccess,
    inCompletedSuccess,
    markCompleteData,
    markInCompleteData,
  ]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load course details</p>;

  const { courseDetails, progress, completed } = data.data;

  const { title } = courseDetails;

  if (!courseDetails?.lectures?.length) {
    return <p>No lectures available for this course.</p>;
  }

  const initialLecture = currentLecture || courseDetails.lectures[0];

  const isLectureCompleted = (lectureId) => {
    return progress.some(
      (prog) =>
        prog.lectureId?.toString() === lectureId?.toString() && prog.viewed,
    );
  };

  const handleLectureProgress = async (lectureId) => {
    try {
      await updateLectureProgress({ courseId, lectureId }).unwrap();
    } catch (error) {
      console.error("Failed to update lecture progress:", error);
    }
  };

  const handleSelectLecture = (lecture) => {
    setCurrentLecture(lecture);
    handleLectureProgress(lecture._id);
  };

  const handleCompleteCourse = async () => {
    await completeCourse(courseId);
  };

  const handleInCompleteCourse = async () => {
    await incompleteCourse(courseId);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Display course name  */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button
          onClick={completed ? handleInCompleteCourse : handleCompleteCourse}
          variant={completed ? "outline" : "default"}
        >
          {completed ? (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />{" "}
              <span>Completed</span>{" "}
            </div>
          ) : (
            "Mark as completed"
          )}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Video section  */}
        <div className="flex-1 md:w-3/5 h-fit rounded-lg shadow-lg p-4">
          <div>
            <video
              src={currentLecture?.videoUrl || initialLecture?.videoUrl}
              controls
              className="w-full h-auto md:rounded-lg"
              onPlay={() =>
                handleLectureProgress(currentLecture?._id || initialLecture._id)
              }
            />
          </div>
          {/* Display current watching lecture title */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">
              {`Lecture ${
                courseDetails.lectures.findIndex(
                  (lec) =>
                    lec._id === (currentLecture?._id || initialLecture._id),
                ) + 1
              } : ${currentLecture?.title || initialLecture.title}`}
            </h3>

            <span className="text-sm text-gray-500">
              {formatDuration(
                currentLecture?.duration || initialLecture?.duration,
              )}
            </span>
          </div>
        </div>
        {/* Lecture Sidebar  */}
        <div className="flex flex-col w-full md:w-2/5 border-t md:border-t-0 md:border-l border-gray-200 md:pl-4 pt-4 md:pt-0">
          <h2 className="font-semibold text-xl mb-4">Course Lecture</h2>
          <div className="flex-1 overflow-y-auto">
            {courseDetails?.lectures.map((lecture) => (
              <Card
                key={lecture._id}
                className={`mb-3 hover:cursor-pointer transition transform ${
                  lecture._id === currentLecture?._id ? "bg-gray-200" : ""
                } `}
                onClick={() => handleSelectLecture(lecture)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    {isLectureCompleted(lecture._id) ? (
                      <CheckCircle2 size={24} className="text-green-500 mr-2" />
                    ) : (
                      <CirclePlay size={24} className="text-gray-500 mr-2" />
                    )}
                    <div>
                      <CardTitle className="text-lg font-medium">
                        {lecture.title}
                      </CardTitle>

                      <p className="text-xs text-gray-500 mt-1">
                        {formatDuration(lecture.duration)}
                      </p>
                    </div>
                  </div>
                  {isLectureCompleted(lecture._id) && (
                    <Badge
                      variant={"outline"}
                      className="bg-green-200 text-green-600"
                    >
                      Completed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgress;

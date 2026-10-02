import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, CirclePlay } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Progress } from "@/components/ui/progress.jsx";
import CourseSkeleton from "@/components/CourseSkeleton.jsx";

import { useGetMyLearningQuery } from "@/features/api/authApi.js";

const MyLearning = () => {
  const { data, isLoading, isError, refetch } = useGetMyLearningQuery();

  const myLearning = data?.courses || [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">My Learning</h1>
        <CourseSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">My Learning</h1>
        <p className="mt-4 text-sm text-red-500">
          Failed to load your courses.
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const completedCourses = myLearning.filter(
    (course) => course.progress?.completed === true,
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Learning</h1>
          <p className="mt-2 text-gray-600">
            Continue your journey and keep building your skills.
          </p>
        </div>

        {/* Learning summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Enrolled Courses</p>
                <p className="text-2xl font-bold">{myLearning.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Completed Courses</p>
                <p className="text-2xl font-bold">{completedCourses}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <CirclePlay className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold">
                  {myLearning.length - completedCourses}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {myLearning.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center p-10 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
              <h2 className="text-xl font-semibold">
                Start your learning journey
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                You have not enrolled in any courses yet.
              </p>
              <Button asChild className="mt-5">
                <Link to="/">Explore Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {myLearning.map((course) => {
              const progress = course.progress || {};
              const totalLectures = progress.totalLectures || 0;
              const completedLectures = progress.completedLectures || 0;
              const percentage = Math.min(
                100,
                Math.max(0, progress.progressPercentage || 0),
              );
              const completed = progress.completed === true;

              return (
                <Card key={course._id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
                    <img
                      src={course.thumbnail || ""}
                      alt={course.title}
                      className="h-44 w-full rounded-md object-cover sm:h-36 sm:w-56"
                    />

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-bold">{course.title}</h2>
                          <p className="mt-1 text-sm text-gray-500">
                            {course.category || "Course"}
                            {course.level ? ` · ${course.level}` : ""}
                          </p>
                        </div>

                        {completed ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Completed
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                            In progress
                          </span>
                        )}
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="text-gray-600">
                            {completedLectures} of {totalLectures} lectures
                          </span>
                          <span className="font-semibold">{percentage}%</span>
                        </div>

                        <Progress value={percentage} className="h-2" />
                      </div>

                      <div className="mt-5">
                        <Button asChild>
                          <Link to={`/course-progress/${course._id}`}>
                            {completed ? "Review Course" : "Continue Learning"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;

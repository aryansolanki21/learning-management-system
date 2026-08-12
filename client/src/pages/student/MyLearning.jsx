import CourseSkeleton from "@/components/CourseSkeleton.jsx";
import Course from "./Course.jsx";

const MyLearning = () => {
  const isLoading = false;
  const myLearningCourses = [];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-0">
      <h1 className="font-bold text-2xl">My Learning</h1>

      {/* Render loading, empty, or enrolled course states */}
      <div className="mt-5">
        {/* Loading placeholder displayed while courses are being fetched */}
        {isLoading ? (
          <CourseSkeleton />
        ) : myLearningCourses.length === 0 ? (
          <p>You are not enrolled in any course.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myLearningCourses.map((course, index) => (
              <Course key={index} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;

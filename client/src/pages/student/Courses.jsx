import Course from "./Course.jsx";
import CourseSkeleton from "@/components/CourseSkeleton.jsx";
import { useGetPublishedCoursesQuery } from "@/features/api/courseApi.js";
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const { data, isLoading, isError } = useGetPublishedCoursesQuery();
  const navigate = useNavigate();

  if (isError) {
    return <h1>Some error occurred while fetching courses.</h1>;
  }

  const courses = data?.courses || [];

  // Group courses by category
  const coursesByCategory = courses.reduce((acc, course) => {
    const category = course.category || "Other";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(course);

    return acc;
  }, {});

  // Popular courses
  const popularCourses = courses.slice(0, 4);

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Popular Courses */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Popular Courses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <CourseSkeleton key={index} />
                ))
              : popularCourses.map((course) => (
                  <Course key={course._id} course={course} />
                ))}
          </div>
        </section>

        {/* Category Sections */}
        {!isLoading &&
          Object.entries(coursesByCategory).map(
            ([category, categoryCourses]) => {
              const visibleCourses = categoryCourses.slice(0, 4);
              const hasMoreCourses = categoryCourses.length > 4;

              return (
                <section key={category} className="mb-12">
                  {/* Category Heading */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{category}</h2>

                      <p className="text-sm text-gray-500 mt-1">
                        Explore {category} courses
                      </p>
                    </div>

                    {hasMoreCourses && (
                      <button
                        onClick={() =>
                          navigate(
                            `/course/search?categories=${encodeURIComponent(
                              category,
                            )}`,
                          )
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View all
                      </button>
                    )}
                  </div>

                  {/* Category Courses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleCourses.map((course) => (
                      <Course key={course._id} course={course} />
                    ))}
                  </div>
                </section>
              );
            },
          )}

        {/* No Courses */}
        {!isLoading && courses.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No courses available yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default Courses;

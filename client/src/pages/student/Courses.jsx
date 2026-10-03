import CourseSkeleton from "@/components/CourseSkeleton.jsx";
import CourseCarousel from "@/components/CourseCarousel.jsx";

import {
  useGetPublishedCoursesQuery,
  useGetRecommendedCoursesQuery,
} from "@/features/api/courseApi.js";

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const { data, isLoading, isError } = useGetPublishedCoursesQuery();

  const { user } = useSelector((store) => store.auth);

  const { data: recommendedData, isLoading: recommendedLoading } =
    useGetRecommendedCoursesQuery(undefined, {
      skip: !user,
    });

  const navigate = useNavigate();

  if (isError) {
    return <h1>Some error occurred while fetching courses.</h1>;
  }

  const courses = data?.courses || [];

  const recommendedCourses = recommendedData?.courses || [];

  // Group all published courses by category
  const coursesByCategory = courses.reduce((acc, course) => {
    const category = course.category || "Other";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(course);

    return acc;
  }, {});

  // getPublishedCourses return Popular courses sorted by enrollment
  const popularCourses = courses;

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Popular Courses */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Popular Courses</h2>
          </div>

          {isLoading ? (
            <div className="flex gap-6 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full shrink-0 sm:w-1/2 lg:w-1/3 xl:w-1/4"
                >
                  <CourseSkeleton />
                </div>
              ))}
            </div>
          ) : popularCourses.length > 0 ? (
            <CourseCarousel courses={popularCourses} />
          ) : (
            <p className="text-sm text-gray-500">
              No popular courses available.
            </p>
          )}
        </section>

        {/* Recommended Courses */}
        {user && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Recommended for You</h2>

              <p className="mt-1 text-sm text-gray-500">
                Courses you may want to explore next.
              </p>
            </div>

            {recommendedLoading ? (
              <div className="flex gap-6 overflow-hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-full shrink-0 sm:w-1/2 lg:w-1/3 xl:w-1/4"
                  >
                    <CourseSkeleton />
                  </div>
                ))}
              </div>
            ) : recommendedCourses.length > 0 ? (
              <CourseCarousel courses={recommendedCourses} />
            ) : (
              <p className="text-sm text-gray-500">
                No recommended courses available right now.
              </p>
            )}
          </section>
        )}

        {/* Category Sections */}
        {!isLoading &&
          Object.entries(coursesByCategory).map(
            ([category, categoryCourses]) => {
              const hasMoreCourses = categoryCourses.length > 4;

              return (
                <section key={category} className="mb-12">
                  {/* Category Heading */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{category}</h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Explore {category} courses
                      </p>
                    </div>

                    {hasMoreCourses && (
                      <button
                        type="button"
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
                  <CourseCarousel courses={categoryCourses} />
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

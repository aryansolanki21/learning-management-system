import { useSearchCoursesQuery } from "@/features/api/courseApi.js";
import Filter from "./Filter.jsx";
import SearchResult from "./SearchResult.jsx";
import CourseSkeleton from "@/components/CourseSkeleton.jsx";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortByPrice, setSortByPrice] = useState("");

  const { data, isLoading, isError } = useSearchCoursesQuery({
    searchQuery: query,
    categories: selectedCategories,
    sortByPrice,
  });

  const handleFilterChange = (categories, price) => {
    setSelectedCategories(categories);
    setSortByPrice(price);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSortByPrice("");
  };

  const courses = data?.courses || [];
  const resultCount = courses.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Search heading */}
      <div className="mb-6">
        {query ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Results for "{query}"
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {isLoading
                ? "Searching courses..."
                : `${resultCount} ${
                    resultCount === 1 ? "course" : "courses"
                  } found`}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Explore Courses
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Discover courses and start learning today.
            </p>
          </>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="mb-6">
        <Filter
          selectedCategories={selectedCategories}
          sortByPrice={sortByPrice}
          handleFilterChange={handleFilterChange}
          clearFilters={clearFilters}
          resultCount={resultCount}
        />
      </div>

      {/* Course results */}
      <div>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <CourseSkeleton key={idx} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />

            <h2 className="text-xl font-semibold text-gray-900">
              Something went wrong
            </h2>

            <p className="text-gray-500 mt-2">
              We couldn't load the courses. Please try again.
            </p>
          </div>
        ) : courses.length === 0 ? (
          <CourseNotFound query={query} />
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <SearchResult key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

const CourseNotFound = ({ query }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-5">
        <Search className="h-8 w-8 text-gray-400" />
      </div>

      <h1 className="font-bold text-2xl text-gray-900">No courses found</h1>

      <p className="text-gray-500 mt-2 max-w-md">
        {query
          ? `We couldn't find any courses matching "${query}".`
          : "There are no courses available with the selected filters."}
      </p>

      <Link to="/" className="mt-4">
        <Button variant="outline">Browse All Courses</Button>
      </Link>
    </div>
  );
};

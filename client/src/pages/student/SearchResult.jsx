import { Badge } from "@/components/ui/badge.jsx";
import { Link } from "react-router-dom";
import { Clock3, Star } from "lucide-react";

const SearchResult = ({ course }) => {
  const averageRating = Number(course.averageRating) || 0;
  const totalReviews = Number(course.totalReviews) || 0;

  return (
    <Link
      to={`/course-detail/${course._id}`}
      className="group block border-b border-gray-200 py-5 first:pt-2 last:border-b-0"
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Course thumbnail */}
        <div className="w-full shrink-0 sm:w-56 md:w-64">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-40 w-full rounded-lg border border-gray-200 object-cover transition-opacity group-hover:opacity-90 sm:h-32 md:h-36"
          />
        </div>

        {/* Course information */}
        <div className="min-w-0 flex-1">
          <div className="flex h-full flex-col">
            <div>
              {/* Course title */}
              <h2 className="line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600 md:text-xl">
                {course.title}
              </h2>

              {/* Subtitle */}
              {course.subtitle && (
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {course.subtitle}
                </p>
              )}

              {/* Instructor */}
              <p className="mt-3 text-sm text-gray-700">
                By{" "}
                <span className="font-semibold">
                  {course.creator?.name || "Instructor"}
                </span>
              </p>

              {/* Rating */}
              <div className="mt-3 flex min-h-5 items-center gap-1.5 text-sm">
                {totalReviews > 0 ? (
                  <>
                    <Star
                      size={16}
                      className="shrink-0 fill-yellow-400 text-yellow-400"
                    />

                    <span className="font-semibold text-gray-900">
                      {averageRating.toFixed(1)}
                    </span>

                    <span className="text-gray-500">
                      ({totalReviews}{" "}
                      {totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">No ratings yet</span>
                )}
              </div>
            </div>

            {/* Course metadata */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {course.level && (
                <Badge variant="secondary" className="font-medium">
                  {course.level}
                </Badge>
              )}

              {course.category && (
                <Badge variant="outline" className="font-medium">
                  {course.category}
                </Badge>
              )}

              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock3 size={15} />
                <span>Self-paced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="shrink-0 sm:w-28 sm:text-right">
          <p className="text-xl font-bold text-gray-900">₹{course.price}</p>

          <p className="mt-1 text-xs text-gray-500">Full course</p>
        </div>
      </div>
    </Link>
  );
};

export default SearchResult;

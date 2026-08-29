import { Badge } from "@/components/ui/badge.jsx";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";

const SearchResult = ({ course }) => {
  return (
    <Link
      to={`/course-detail/${course._id}`}
      className="group block border-b border-gray-200 py-5 first:pt-2 last:border-b-0"
    >
      {" "}
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Course thumbnail */}{" "}
        <div className="w-full sm:w-56 md:w-64 shrink-0">
          {" "}
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-40 sm:h-32 md:h-36 object-cover rounded-lg border border-gray-200 group-hover:opacity-90 transition-opacity"
          />{" "}
        </div>
        {/* Course information */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col h-full">
            <div>
              <h2 className="font-bold text-lg md:text-xl text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {course.title}
              </h2>

              {course.subtitle && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {course.subtitle}
                </p>
              )}

              <p className="text-sm text-gray-700 mt-3">
                By{" "}
                <span className="font-semibold">
                  {course.creator?.name || "Instructor"}
                </span>
              </p>
            </div>

            {/* Course metadata */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
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
        <div className="sm:w-28 shrink-0 sm:text-right">
          <p className="text-xl font-bold text-gray-900">₹{course.price}</p>

          <p className="text-xs text-gray-500 mt-1">Full course</p>
        </div>
      </div>
    </Link>
  );
};

export default SearchResult;

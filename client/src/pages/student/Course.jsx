import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { formatDuration } from "@/utils/formatDuration.js";
import { Clock3, PlayCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Course = ({ course }) => {
  // Calculate total duration of all lectures.
  const totalDuration =
    course.lectures?.reduce(
      (total, lecture) => total + (lecture.duration || 0),
      0,
    ) || 0;

  // Review statistics provided by getPublishedCourses.
  const averageRating = Number(course.averageRating ?? 0);
  const totalReviews = Number(course.totalReviews ?? 0);

  const instructorName = course.creator?.name || "Instructor";

  const instructorInitials =
    instructorName
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IN";

  return (
    <Link to={`/course-detail/${course._id}`} className="block h-full">
      <Card className="pt-0 h-full overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
        {/* Course Thumbnail */}
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />

        <CardContent className="px-5 py-4 space-y-3">
          {/* Course Title */}
          <h2 className="font-bold text-lg leading-tight line-clamp-2">
            {course.title}
          </h2>

          {/* Instructor + Level */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={
                    course.creator?.photoUrl || "https://github.com/shadcn.png"
                  }
                  alt={instructorName}
                />

                <AvatarFallback>{instructorInitials}</AvatarFallback>
              </Avatar>

              <span className="font-medium text-sm truncate">
                {instructorName}
              </span>
            </div>

            {course.level && (
              <Badge className="bg-blue-600 text-white px-2 py-1 text-xs rounded-full shrink-0">
                {course.level}
              </Badge>
            )}
          </div>

          {/* Rating and Review Count */}
          <div className="flex items-center gap-1.5 text-sm min-h-5">
            {totalReviews > 0 ? (
              <>
                <Star
                  size={16}
                  className="fill-yellow-400 text-yellow-400 shrink-0"
                />

                <span className="font-semibold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>

                <span className="text-gray-500">
                  ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-gray-500">No ratings yet</span>
            )}
          </div>

          {/* Lecture Count + Duration */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <PlayCircle size={16} />
              <span>{course.lectures?.length || 0} lectures</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock3 size={16} />
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>

          {/* Price */}
          <div>
            <span className="text-xl font-bold">₹{course.price}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Course;

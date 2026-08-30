import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { formatDuration } from "@/utils/formatDuration.js";
import { Clock3, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Course = ({ course }) => {
  // Calculate total duration of all lectures
  const totalDuration =
    course.lectures?.reduce(
      (total, lecture) => total + (lecture.duration || 0),
      0,
    ) || 0;

  return (
    <Link to={`/course-detail/${course._id}`}>
      <Card className="pt-0 overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 h-full">
        {/* Course Thumbnail */}
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />

        <CardContent className="px-5 py-4 space-y-3">
          {/* Course Title */}
          <h1 className="font-bold text-lg leading-tight line-clamp-2">
            {course.title}
          </h1>

          {/* Instructor + Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    course.creator?.photoUrl || "https://github.com/shadcn.png"
                  }
                  alt={course.creator?.name || "Instructor"}
                />

                <AvatarFallback>
                  {course.creator?.name
                    ?.split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase() || "IN"}
                </AvatarFallback>
              </Avatar>

              <span className="font-medium text-sm">
                {course.creator?.name}
              </span>
            </div>

            <Badge className="bg-blue-600 text-white px-2 py-1 text-xs rounded-full">
              {course.level}
            </Badge>
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

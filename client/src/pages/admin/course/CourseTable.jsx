import AppLoader from "@/components/AppLoader.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useGetCreatorCoursesQuery } from "@/features/api/courseApi.js";

import { Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CourseTable = () => {
  const { data, isLoading, isError } = useGetCreatorCoursesQuery();

  const navigate = useNavigate();

  if (isLoading) {
    return <AppLoader />;
  }

  if (isError) {
    return <p className="text-red-500">Failed to load courses.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Navigate to the course creation page. */}
      <Button onClick={() => navigate("create")}>Create a new course</Button>

      <Table>
        <TableCaption>A list of your recent courses.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-25">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.courses.map((course) => (
            <TableRow key={course._id}>
              <TableCell className="font-medium">
                {course?.price || "NA"}
              </TableCell>
              <TableCell>
                <Badge>{course?.isPublished ? "Published" : "Draft"}</Badge>
              </TableCell>
              <TableCell>{course?.title}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => navigate(`${course._id}`)}>
                  <Edit />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourseTable;

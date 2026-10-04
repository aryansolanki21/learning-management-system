import AppLoader from "@/components/AppLoader.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.jsx";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useDeleteCourseMutation,
  useGetCreatorCoursesQuery,
} from "@/features/api/courseApi.js";

import { BookOpen, Edit, Loader2, Plus, Trash2 } from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CourseTable = () => {
  const { data, isLoading, isError } = useGetCreatorCoursesQuery();

  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

  const navigate = useNavigate();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const courses = data?.courses ?? [];

  const handleOpenDeleteDialog = (course) => {
    setSelectedCourse(course);
    setDeleteError("");
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) {
      return;
    }

    setSelectedCourse(null);
    setDeleteError("");
  };

  const handleDeleteCourse = async (event) => {
    // Prevent AlertDialogAction from closing the dialog
    // before the asynchronous delete request finishes.
    event.preventDefault();

    if (!selectedCourse?._id) {
      return;
    }

    setDeleteError("");

    try {
      await deleteCourse(selectedCourse._id).unwrap();

      setSelectedCourse(null);
    } catch (error) {
      setDeleteError(
        error?.data?.message ||
          "Failed to delete the course. Please try again.",
      );
    }
  };

  if (isLoading) {
    return <AppLoader />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-red-500">Failed to load courses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage, and organize your courses.
          </p>
        </div>

        <Button onClick={() => navigate("create")} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>

          <h2 className="text-lg font-semibold">No courses yet</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Create your first course and start building your curriculum.
          </p>

          <Button className="mt-5" onClick={() => navigate("create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Course
          </Button>
        </div>
      ) : (
        /* Course table */
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>A list of your courses.</TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[300px]">Course</TableHead>

                  <TableHead>Category</TableHead>

                  <TableHead>Lectures</TableHead>

                  <TableHead>Price</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {courses.map((course) => {
                  const lectureCount = course?.lectures?.length || 0;

                  return (
                    <TableRow key={course._id}>
                      {/* Course */}
                      <TableCell>
                        <div className="flex min-w-[260px] items-center gap-3">
                          {course?.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="h-14 w-24 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md bg-muted">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {course?.title}
                            </p>

                            {course?.subtitle && (
                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {course.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <span className="whitespace-nowrap text-sm">
                          {course?.category || "—"}
                        </span>
                      </TableCell>

                      {/* Lectures */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lectureCount}</span>
                        </div>
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        <span className="whitespace-nowrap font-medium">
                          {Number(course?.price || 0) === 0
                            ? "Free"
                            : `₹${Number(course.price).toLocaleString(
                                "en-IN",
                              )}`}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={
                            course?.isPublished ? "default" : "secondary"
                          }
                        >
                          {course?.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`${course._id}`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleOpenDeleteDialog(course)}
                            disabled={isDeleting}
                            aria-label={`Delete ${course.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={Boolean(selectedCourse)}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {selectedCourse?.title}
              </span>{" "}
              and its lectures, reviews, progress records, and uploaded course
              media.
              <br />
              <br />
              Historical purchase records will be preserved. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {deleteError}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteCourse}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseTable;

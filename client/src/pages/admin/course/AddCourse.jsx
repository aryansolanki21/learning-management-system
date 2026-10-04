import CourseBasicInfoForm from "./CourseBasicInfoForm.jsx";

import { useCreateCourseMutation } from "@/features/api/courseApi.js";
import { toast } from "@/components/ui/toast.jsx";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddCourse = () => {
  const [input, setInput] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    level: "",
    price: "",
    thumbnail: null,
  });

  const [previewThumbnail, setPreviewThumbnail] = useState("");

  const [createCourse, { isLoading }] = useCreateCourseMutation();

  const navigate = useNavigate();

  const createCourseHandler = async (event) => {
    event.preventDefault();

    const title = input.title.trim();

    if (!title) {
      toast.add({
        type: "error",
        title: "Course title is required.",
      });
      return;
    }

    if (!input.category) {
      toast.add({
        type: "error",
        title: "Please select a course category.",
      });
      return;
    }

    if (input.price !== "") {
      const price = Number(input.price);

      if (!Number.isFinite(price) || price < 0) {
        toast.add({
          type: "error",
          title: "Please enter a valid non-negative price.",
        });
        return;
      }
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("subtitle", input.subtitle.trim());
    formData.append("description", input.description.trim());
    formData.append("category", input.category);
    formData.append("level", input.level);

    // Let the backend convert an empty price to 0.
    formData.append("price", input.price);

    if (input.thumbnail instanceof File) {
      formData.append("thumbnail", input.thumbnail);
    }

    try {
      const response = await createCourse(formData).unwrap();

      toast.add({
        type: "success",
        title: response?.message || "Course created successfully.",
      });

      // Open the newly created course directly in the Course Builder.
      if (response?.course?._id) {
        navigate(`/admin/course/${response.course._id}`);
      } else {
        navigate("/admin/course");
      }
    } catch (error) {
      console.error("Failed to create course:", error);

      toast.add({
        type: "error",
        title: "Failed to create course.",
        description:
          error?.data?.message ||
          "Please check the course details and try again.",
      });
    }
  };

  const cancelHandler = () => {
    navigate("/admin/course");
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Course</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Add the course details now. You can add lectures and publish the
          course after creating it.
        </p>
      </div>

      <CourseBasicInfoForm
        input={input}
        setInput={setInput}
        previewThumbnail={previewThumbnail}
        setPreviewThumbnail={setPreviewThumbnail}
        isSubmitting={isLoading}
        onSubmit={createCourseHandler}
        onCancel={cancelHandler}
        submitLabel="Create Course"
      />
    </div>
  );
};

export default AddCourse;

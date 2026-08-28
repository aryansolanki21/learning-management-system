import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast.jsx";

import { useCreateCourseMutation } from "@/features/api/courseApi.js";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Available course categories displayed in the category selector.
const categories = [
  { label: "Next JS", value: "Next JS" },
  { label: "Data Science", value: "Data Science" },
  { label: "Frontend Development", value: "Frontend Development" },
  { label: "Fullstack Development", value: "Fullstack Development" },
  { label: "MERN Stack Development", value: "MERN Stack Development" },
  { label: "Javascript", value: "Javascript" },
  { label: "Python", value: "Python" },
  { label: "Docker", value: "Docker" },
  { label: "MongoDB", value: "MongoDB" },
  { label: "HTML", value: "HTML" },
];

const AddCourse = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [createCourse, { data, isLoading, isSuccess }] =
    useCreateCourseMutation();

  const navigate = useNavigate();

  const handleCategoryChange = (value) => {
    setCategory(value);
  };

  // Create a new course using the provided title and category.
  const createCourseHandler = async () => {
    try {
      await createCourse({ title, category }).unwrap();
    } catch (error) {
      console.error(error);
    }
  };

  // Display success notification and redirect after course creation.
  useEffect(() => {
    if (isSuccess) {
      toast.add({
        type: "success",
        title: data?.message || "Course created!",
      });

      navigate("/admin/course");
    }
  }, [isSuccess, data?.message, navigate]);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="font-bold text-xl">
          Let's add a course, add some basic course details for your new course
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the course title and choose a category. You can edit course
          details later.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            type="text"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter course title"
          />
        </div>

        <div>
          <Label>Category</Label>

          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Category</SelectLabel>

                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/course")}>
            Back
          </Button>
          <Button disabled={isLoading} onClick={createCourseHandler}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;

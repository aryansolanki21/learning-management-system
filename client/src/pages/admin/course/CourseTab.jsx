import RichTextEditor from "@/components/RichTextEditor.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { toast } from "@/components/ui/toast.jsx";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useEditCourseMutation,
  useGetCourseByIdQuery,
  usePublishCourseMutation,
} from "@/features/api/courseApi.js";

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

const level = ["Beginner", "Intermediate", "Advanced"];

const CourseTab = () => {
  const [input, setInput] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    level: "",
    price: "",
    thumbnail: "",
  });

  const [previewThumbnail, setPreviewThumbnail] = useState("");

  const navigate = useNavigate();
  const params = useParams();
  const courseId = params.courseId;

  const {
    data: courseByIdData,
    isLoading: courseByIdLoading,
    refetch,
  } = useGetCourseByIdQuery(courseId, { refetchOnMountOrArgChange: true });

  const [publishCourse] = usePublishCourseMutation();

  useEffect(() => {
    if (courseByIdData?.course) {
      const course = courseByIdData.course;

      setInput({
        title: course.title ?? "",
        subtitle: course.subtitle ?? "",
        description: course.description ?? "",
        category: course.category ?? "",
        level: course.level ?? "",
        price: course.price ?? "",
        thumbnail: "",
      });
    }
  }, [courseByIdData?.course]);

  const [editCourse, { data, isLoading, isSuccess, error }] =
    useEditCourseMutation();

  const changeEventHandler = (event) => {
    const { name, value } = event.target;
    setInput({ ...input, [name]: value });
  };

  const selectCategory = (value) => {
    setInput({ ...input, category: value });
  };

  const selectLevel = (value) => {
    setInput({ ...input, level: value });
  };

  const selectThumbnail = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      setInput({ ...input, thumbnail: file });

      const fileReader = new FileReader();

      fileReader.onloadend = () => setPreviewThumbnail(fileReader.result);
      fileReader.readAsDataURL(file);
    }
  };

  const updateCourseHandler = async () => {
    const formData = new FormData();
    formData.append("title", input.title);
    formData.append("subtitle", input.subtitle);
    formData.append("description", input.description);
    formData.append("category", input.category);
    formData.append("level", input.level);
    formData.append("price", input.price);
    formData.append("thumbnail", input.thumbnail);

    await editCourse({ formData, courseId });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.add({
        title: "Success",
        description: data.message || "Course updated.",
      });
    }
    if (error) {
      toast.add({
        title: "Error",
        description: error.data.message || "Failed to update course.",
      });
    }
  }, [data, error, isSuccess]);

  if (courseByIdLoading) return <h1>Loading...</h1>;

  const publishStatusHandler = async (action) => {
    try {
      const response = await publishCourse({
        courseId,
        query: action,
      }).unwrap();

      refetch();

      toast.add({
        title: "Success",
        description: response.message,
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description:
          error?.data?.message || "Failed to publish or unpublish course.",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between">
        <div>
          <CardTitle>Basic Course Information</CardTitle>
          <CardDescription>
            Make changes to your courses here. Click save when you're done.
          </CardDescription>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={courseByIdData?.course.lectures.length === 0}
            onClick={() =>
              publishStatusHandler(
                courseByIdData?.course.isPublished ? "false" : "true",
              )
            }
          >
            {courseByIdData?.course.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button>Remove Course</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-5">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              type="text"
              name="title"
              value={input.title}
              onChange={changeEventHandler}
              placeholder="Ex. Fullstack developer"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              type="text"
              name="subTitle"
              value={input.subTitle}
              onChange={changeEventHandler}
              placeholder="Ex. Become a Fullstack developer from zero to hero in 2 months"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor input={input} setInput={setInput} />
          </div>
          <div className="flex items-center gap-5">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={input.category} onValueChange={selectCategory}>
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
            <div className="space-y-2">
              <Label>Course Level</Label>
              <Select value={input.level} onValueChange={selectLevel}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select a course level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Course Level</SelectLabel>
                    {level.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price in (INR)</Label>
              <Input
                type="number"
                name="price"
                value={input.price}
                onChange={changeEventHandler}
                placeholder="199"
                className="w-fit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Course Thumbnail</Label>
            <Input
              type="file"
              name="thumbnail"
              onChange={selectThumbnail}
              accept="image/*"
              className="w-fit"
            />
            {previewThumbnail && (
              <img
                src={previewThumbnail}
                className="w-64 my-2"
                alt="Course Thumbnail"
              />
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate("/admin/course")}>
              Cancel
            </Button>
            <Button disabled={isLoading} onClick={updateCourseHandler}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseTab;

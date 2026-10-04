import RichTextEditor from "@/components/RichTextEditor.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { toast } from "@/components/ui/toast.jsx";

import { Loader2 } from "lucide-react";

import { COURSE_CATEGORIES, COURSE_LEVELS } from "./courseConstants.js";

const CourseBasicInfoForm = ({
  input,
  setInput,
  previewThumbnail,
  setPreviewThumbnail,
  existingThumbnail = "",
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel = "Save Changes",
  submittingLabel = "Saving...",
}) => {
  const changeEventHandler = (event) => {
    const { name, value } = event.target;

    setInput((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const selectCategory = (value) => {
    setInput((previous) => ({
      ...previous,
      category: value,
    }));
  };

  const selectLevel = (value) => {
    setInput((previous) => ({
      ...previous,
      level: value,
    }));
  };

  const selectThumbnail = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.add({
        type: "error",
        title: "Invalid thumbnail",
        description: "Please select a valid image file.",
      });

      event.target.value = "";
      return;
    }

    setInput((previous) => ({
      ...previous,
      thumbnail: file,
    }));

    const fileReader = new FileReader();

    fileReader.onloadend = () => {
      setPreviewThumbnail(fileReader.result);
    };

    fileReader.readAsDataURL(file);
  };

  return (
    <form onSubmit={onSubmit}>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Course Information</CardTitle>

          <CardDescription>
            Add the information students will see before enrolling in your
            course.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Title + Subtitle */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                Course Title <span className="text-red-500">*</span>
              </Label>

              <Input
                id="title"
                type="text"
                name="title"
                value={input.title}
                onChange={changeEventHandler}
                placeholder="Ex. Full Stack Web Development"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>

              <Input
                id="subtitle"
                type="text"
                name="subtitle"
                value={input.subtitle}
                onChange={changeEventHandler}
                placeholder="Ex. Learn modern web development from scratch"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>

            <RichTextEditor input={input} setInput={setInput} />
          </div>

          {/* Category + Level + Price */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>

              <Select value={input.category} onValueChange={selectCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Category</SelectLabel>

                    {COURSE_CATEGORIES.map((category) => (
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a course level" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Course Level</SelectLabel>

                    {COURSE_LEVELS.map((courseLevel) => (
                      <SelectItem key={courseLevel} value={courseLevel}>
                        {courseLevel}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>

              <Input
                id="price"
                type="number"
                name="price"
                value={input.price}
                onChange={changeEventHandler}
                placeholder="199"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="thumbnail">Course Thumbnail</Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Upload an image that represents your course.
              </p>
            </div>

            <Input
              id="thumbnail"
              type="file"
              name="thumbnail"
              accept="image/*"
              onChange={selectThumbnail}
              className="max-w-md"
            />

            {(previewThumbnail || existingThumbnail) && (
              <div className="rounded-lg border bg-gray-50 p-3">
                <p className="mb-2 text-sm font-medium">
                  {previewThumbnail
                    ? "New Thumbnail Preview"
                    : "Current Thumbnail"}
                </p>

                <img
                  src={previewThumbnail || existingThumbnail}
                  alt="Course thumbnail"
                  className="max-h-60 w-auto rounded-md object-cover"
                />
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-2 border-t bg-gray-50 p-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default CourseBasicInfoForm;

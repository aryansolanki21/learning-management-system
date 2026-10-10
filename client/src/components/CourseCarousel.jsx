import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel.jsx";

import Course from "@/pages/student/Course.jsx";

const CourseCarousel = ({ courses }) => {
  if (!courses?.length) {
    return null;
  }

  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
      }}
      className="w-full min-w-0"
    >
      <CarouselContent className="-ml-4">
        {courses.map((course) => (
          <CarouselItem
            key={course._id}
            className="min-w-0 basis-full pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
          >
            <div className="h-full p-1">
              <Course course={course} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Position navigation arrows over the thumbnail, not the title */}
      <CarouselPrevious
        aria-label="Previous courses"
        className="left-2 top-17 bottom-auto z-20 my-0 disabled:hidden"
      />

      <CarouselNext
        aria-label="Next courses"
        className="right-2 top-17 bottom-auto z-20 my-0 disabled:hidden"
      />
    </Carousel>
  );
};

export default CourseCarousel;

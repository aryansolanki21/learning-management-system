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
      className="w-full"
    >
      <CarouselContent className="-ml-4">
        {courses.map((course) => (
          <CarouselItem
            key={course._id}
            className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
          >
            <div className="h-full p-1">
              <Course course={course} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-2 xl:-left-12" />
      <CarouselNext className="right-2 xl:-right-12" />
    </Carousel>
  );
};

export default CourseCarousel;

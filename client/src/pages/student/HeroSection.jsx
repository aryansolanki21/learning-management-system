import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[430px] flex items-center py-16 md:py-20">
          <div className="max-w-3xl">
            {/* Small badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 mb-6">
              <PlayCircle size={16} />
              Learn at your own pace
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              Learn skills that
              <span className="block text-blue-600">
                move your career forward.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
              Discover practical courses, build real-world skills, and learn
              from anywhere at your own pace.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/course/search")}
                className="h-12 px-6 rounded-lg"
              >
                Explore Courses
                <ArrowRight className="ml-2" size={18} />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/my-learning")}
                className="h-12 px-6 rounded-lg"
              >
                <BookOpen className="mr-2" size={18} />
                My Learning
              </Button>
            </div>

            {/* Benefits */}
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-blue-600" />
                Learn anytime
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-blue-600" />
                Expert-led courses
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-blue-600" />
                Track your progress
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

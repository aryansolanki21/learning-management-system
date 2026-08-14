import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  const searchHandler = (event) => {
    event.preventDefault();

    if (searchQuery.trim() !== "") {
      navigate(`/course/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
    setSearchQuery("");
  };

  return (
    <div className="relative bg-linear-to-r from-blue-500 to-indigo-600 py-24 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          find the Best Courses for you
        </h1>
        <p className="text-gray-200 mb-8">
          Discover, Learn, and Upskill with our wide range of courses
        </p>

        <form
          onSubmit={searchHandler}
          className="flex items-center bg-white rounded-full shadow-lg overflow-hidden max-w-xl mx-auto mb-6"
        >
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search courses..."
            className="flex-1 h-12 px-6 border-none rounded-l-full focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 border-0 rounded-r-full px-6 bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </form>
        <Button
          onClick={() => navigate("/course/search")}
          className="bg-white border-0 text-blue-600 rounded-full hover:bg-gray-200"
        >
          Explore Courses
        </Button>
      </div>
    </div>
  );
};

export default HeroSection;

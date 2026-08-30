import { Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDuration } from "@/utils/formatDuration";

const Lecture = ({ lecture, courseId, index }) => {
  const navigate = useNavigate();

  const goToUpdateLecture = () => {
    navigate(`${lecture._id}`);
  };

  return (
    <div className="flex items-center justify-between bg-[#F7F9FA] px-4 py-2 rounded-md my-2">
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-gray-800">
          Lecture - {index + 1}: {lecture.title}
        </h1>

        <span className="text-sm text-gray-500">
          {formatDuration(lecture.duration)}
        </span>
      </div>

      <Edit
        onClick={goToUpdateLecture}
        size={20}
        className="cursor-pointer text-gray-600 hover:text-blue-600"
      />
    </div>
  );
};

export default Lecture;

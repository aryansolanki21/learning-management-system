import { Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Lecture = ({ lecture, courseId, index }) => {
  const navigate = useNavigate();

  const goToUpdateLecture = () => {
    navigate(`${lecture._id}`);
  };

  return (
    <div className="flex items-center justify-between bg-[#F7F9FA] px-4 py-2 rounded-md my-2">
      <h1 className="font-bold text-gray-800">
        Lecture - {index + 1}: {lecture.lectureTitle}
      </h1>
      <Edit
        onClick={goToUpdateLecture}
        size={20}
        className=" cursor-pointer text-gray-600 hover:text-blue-600"
      />
    </div>
  );
};

export default Lecture;

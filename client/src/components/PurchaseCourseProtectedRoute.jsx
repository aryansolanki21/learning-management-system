import { useGetCourseDetailWithPurchaseStatusQuery } from "@/features/api/purchaseApi.js";
import { Navigate, useParams } from "react-router-dom";

const PurchaseCourseProtectedRoute = ({ children }) => {
  const { courseId } = useParams();
  const { data, isLoading } = useGetCourseDetailWithPurchaseStatusQuery(courseId);

  if (isLoading) return <p>Loading...</p>;

  return data?.isPurchased ? (
    children
  ) : (
    <Navigate to={`/course-detail/${courseId}`} />
  );
};

export default PurchaseCourseProtectedRoute;

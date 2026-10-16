import {
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from "@/features/api/purchaseApi.js";
import { Button } from "./ui/button.jsx";
import { Loader2 } from "lucide-react";
import { toast } from "./ui/toast.jsx";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const BuyCourseButton = ({ courseId }) => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  const [createRazorpayOrder, { isLoading: isCreatingOrder }] =
    useCreateRazorpayOrderMutation();

  const [verifyRazorpayPayment, { isLoading: isVerifyingPayment }] =
    useVerifyRazorpayPaymentMutation();

  const purchaseCourseHandler = async () => {
    if (!user) {
      const coursePath = `/course-detail/${courseId}`;

      toast.add({
        title: "Login required",
        description: "Please log in or sign up to purchase this course.",
      });

      navigate(`/login?tab=login&redirect=${encodeURIComponent(coursePath)}`);

      return;
    }

    try {
      const response = await createRazorpayOrder(courseId).unwrap();

      const options = {
        key: response.key,
        amount: response.order.amount,
        currency: response.order.currency,
        name: "SkillNest",
        description: "Course Purchase",
        order_id: response.order.id,

        handler: async function (paymentResponse) {
          try {
            const verificationResponse =
              await verifyRazorpayPayment(paymentResponse).unwrap();

            toast.add({
              title: "Success",
              description:
                verificationResponse.message || "Payment successful!",
            });
          } catch (error) {
            console.error("Payment verification error:", error);

            toast.add({
              title: "Error",
              description:
                error?.data?.message || "Payment verification failed.",
            });
          }
        },

        theme: {
          color: "#2563eb",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response);

        toast.add({
          title: "Payment Failed",
          description:
            response?.error?.description || "Payment failed. Please try again.",
        });
      });

      razorpay.open();
    } catch (error) {
      console.error("Failed to create payment order:", error);

      toast.add({
        title: "Error",
        description: error?.data?.message || "Failed to create payment order.",
      });
    }
  };

  const isProcessing = isCreatingOrder || isVerifyingPayment;

  return (
    <Button
      disabled={isProcessing}
      onClick={purchaseCourseHandler}
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </>
      ) : (
        "Purchase Course"
      )}
    </Button>
  );
};

export default BuyCourseButton;

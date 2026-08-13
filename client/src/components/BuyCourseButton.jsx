import {
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from "@/features/api/purchaseApi.js";
import { Button } from "./ui/button.jsx";
import { Loader2 } from "lucide-react";
import { toast } from "./ui/toast.jsx";

const BuyCourseButton = ({ courseId }) => {
  const [createRazorpayOrder, { isLoading: isCreatingOrder }] =
    useCreateRazorpayOrderMutation();

  const [verifyRazorpayPayment, { isLoading: isVerifyingPayment }] =
    useVerifyRazorpayPaymentMutation();

  const purchaseCourseHandler = async () => {
    try {
      const response = await createRazorpayOrder(courseId).unwrap();

      const options = {
        key: response.key,

        amount: response.order.amount,

        currency: response.order.currency,

        name: "Learning Management System",

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
          color: "#3399cc",
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
      console.error(error);

      toast.add({
        title: "Error",
        description: error?.data?.message || "Failed to create payment order.",
      });
    }
  };

  return (
    <Button
      disabled={isCreatingOrder || isVerifyingPayment}
      onClick={purchaseCourseHandler}
      className="w-full"
    >
      {isCreatingOrder || isVerifyingPayment ? (
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

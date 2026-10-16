const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export const sendVerificationOtpEmail = async ({ to, otp }) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS is not fully configured.");
  }

  const templateParams = {
    to_email: to,
    otp,
    expiry_minutes: 10,
  };

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams,
  };

  // Keep the private key on the backend.
  if (privateKey) {
    payload.accessToken = privateKey;
  }

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const providerMessage = await response.text();

    throw new Error(
      `EmailJS rejected the email request (${response.status}): ` +
        providerMessage.slice(0, 300),
    );
  }
};

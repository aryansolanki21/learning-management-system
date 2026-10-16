import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useRegisterUserMutation,
  useVerifyEmailOtpMutation,
  useResendVerificationOtpMutation,
  useLoginUserMutation,
  useGoogleLoginMutation,
} from "@/features/api/authApi.js";

const getErrorMessage = (error, fallback) => error?.data?.message || fallback;

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab =
    searchParams.get("tab") === "signup" ? "signup" : "login";

  const [signupInput, setSignupInput] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loginInput, setLoginInput] = useState({
    email: "",
    password: "",
  });

  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [googleButtonWidth, setGoogleButtonWidth] = useState(() => {
    if (typeof window === "undefined") return "400";

    return window.matchMedia("(max-width: 480px)").matches ? "280" : "400";
  });

  const [registerUser, { isLoading: registerIsLoading }] =
    useRegisterUserMutation();

  const [verifyEmailOtp, { isLoading: verifyIsLoading }] =
    useVerifyEmailOtpMutation();

  const [resendVerificationOtp, { isLoading: resendIsLoading }] =
    useResendVerificationOtpMutation();

  const [loginUser, { isLoading: loginIsLoading }] = useLoginUserMutation();

  const [googleLogin, { isLoading: googleIsLoading }] =
    useGoogleLoginMutation();

  const navigate = useNavigate();

  const getPostAuthPath = () => {
    const redirectTo = searchParams.get("redirect");

    // Only permit local application paths.
    if (
      redirectTo &&
      redirectTo.startsWith("/") &&
      !redirectTo.startsWith("//") &&
      !redirectTo.includes("\\")
    ) {
      return redirectTo;
    }

    return "/";
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 480px)");

    const handleWidthChange = (event) => {
      setGoogleButtonWidth(event.matches ? "280" : "400");
    };

    mediaQuery.addEventListener("change", handleWidthChange);

    return () => {
      mediaQuery.removeEventListener("change", handleWidthChange);
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendCooldown]);

  const changeInputHandler = (event, type) => {
    const { name, value } = event.target;

    if (type === "signup") {
      setSignupInput((current) => ({
        ...current,
        [name]: value,
      }));
    } else {
      setLoginInput((current) => ({
        ...current,
        [name]: value,
      }));
    }
  };

  const handleRegistration = async () => {
    try {
      const result = await registerUser(signupInput).unwrap();

      const email = signupInput.email.trim().toLowerCase();

      setPendingEmail(email);
      setOtp("");
      setShowVerification(true);
      setResendCooldown(60);

      toast.add({
        type: "success",
        title: result.message || "Check your email for the verification code.",
      });
    } catch (error) {
      const message = getErrorMessage(error, "Signup failed.");

      toast.add({
        type: "error",
        title: message,
      });

      // A duplicate email may belong to an account awaiting verification.
      // Offer the verification screen, but do not disclose account status.
      if (error?.status === 429) {
        setResendCooldown(
          Math.max(0, Number(error?.data?.retryAfterSeconds) || 60),
        );
      }
    }
  };

  const handleLogin = async () => {
    try {
      const result = await loginUser(loginInput).unwrap();

      toast.add({
        type: "success",
        title: result.message || "Login successful!",
      });

      navigate(getPostAuthPath(), { replace: true });
    } catch (error) {
      if (error?.data?.code === "EMAIL_NOT_VERIFIED") {
        setPendingEmail(loginInput.email.trim().toLowerCase());
        setOtp("");
        setShowVerification(true);
        setResendCooldown(0);

        toast.add({
          type: "error",
          title:
            "Please verify your email. Enter the code if you have it, or request a new one.",
        });

        return;
      }

      toast.add({
        type: "error",
        title: getErrorMessage(error, "Login failed."),
      });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;

    if (!credential) {
      toast.add({
        type: "error",
        title:
          "Google did not return a valid sign-in credential. Please try again.",
      });
      return;
    }

    try {
      const result = await googleLogin({ credential }).unwrap();

      toast.add({
        type: "success",
        title: result.message || "Google sign-in successful!",
      });

      navigate(getPostAuthPath(), { replace: true });
    } catch (error) {
      toast.add({
        type: "error",
        title: getErrorMessage(
          error,
          "Unable to sign in with Google. Please try again.",
        ),
      });
    }
  };

  const handleGoogleError = () => {
    toast.add({
      type: "error",
      title: "Google sign-in could not be started. Please try again.",
    });
  };

  const handleVerifyEmail = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.add({
        type: "error",
        title: "Enter the six-digit verification code.",
      });
      return;
    }

    try {
      const result = await verifyEmailOtp({
        email: pendingEmail,
        otp,
      }).unwrap();

      toast.add({
        type: "success",
        title: result.message || "Email verified successfully!",
      });

      setShowVerification(false);
      setOtp("");
      navigate(getPostAuthPath(), { replace: true });
    } catch (error) {
      toast.add({
        type: "error",
        title: getErrorMessage(error, "Unable to verify your email."),
      });
    }
  };

  const handleResendOtp = async () => {
    try {
      const result = await resendVerificationOtp({
        email: pendingEmail,
      }).unwrap();

      setResendCooldown(60);

      toast.add({
        type: "success",
        title: result.message || "A new verification code has been sent.",
      });
    } catch (error) {
      const retryAfter = Number(error?.data?.retryAfterSeconds);

      if (error?.status === 429) {
        setResendCooldown(Math.max(1, retryAfter || resendCooldown || 60));
      }

      toast.add({
        type: "error",
        title: getErrorMessage(
          error,
          "Unable to resend the verification code.",
        ),
      });
    }
  };

  if (showVerification) {
    return (
      <div className="flex w-full justify-center px-4 pt-8 pb-12 sm:py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MailCheck size={25} />
            </div>

            <CardTitle>Verify your email</CardTitle>

            <CardDescription>
              Enter the six-digit code sent to{" "}
              <span className="font-medium text-foreground">
                {pendingEmail}
              </span>
              . The code expires after 10 minutes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-otp">Verification code</Label>

              <Input
                id="verification-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                disabled={verifyIsLoading}
              />
            </div>

            <Button
              className="w-full"
              type="button"
              disabled={verifyIsLoading || otp.length !== 6}
              onClick={handleVerifyEmail}
            >
              {verifyIsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify email"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the code?
              <div className="mt-2">
                <Button
                  type="button"
                  variant="link"
                  disabled={resendIsLoading || resendCooldown > 0}
                  onClick={handleResendOtp}
                >
                  {resendIsLoading
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend verification code"}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
              type="button"
              disabled={verifyIsLoading || resendIsLoading}
              onClick={() => {
                setShowVerification(false);
                setOtp("");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center px-4 pt-8 pb-12 sm:py-16">
      <Tabs
        value={requestedTab}
        onValueChange={(value) => {
          if (value !== "login" && value !== "signup") return;

          setSearchParams(
            (currentParams) => {
              const nextParams = new URLSearchParams(currentParams);
              nextParams.set("tab", value);
              return nextParams;
            },
            { replace: true },
          );
        }}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signup">Signup</TabsTrigger>
          <TabsTrigger value="login">Login</TabsTrigger>
        </TabsList>

        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>
                Enter your details. We'll email you a code to verify your
                address before completing registration.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={signupInput.name}
                  onChange={(event) => changeInputHandler(event, "signup")}
                  placeholder="Aryan Solanki"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={signupInput.email}
                  onChange={(event) => changeInputHandler(event, "signup")}
                  placeholder="aryan123@gmail.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={signupInput.password}
                  onChange={(event) => changeInputHandler(event, "signup")}
                  placeholder="Create a password"
                  minLength={6}
                  required
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use at least 6 characters, including an uppercase letter, a
                  lowercase letter, and a number.
                </p>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                {googleIsLoading ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Google...
                  </Button>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                    width={googleButtonWidth}
                  />
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                className="w-full"
                disabled={
                  registerIsLoading ||
                  !signupInput.name.trim() ||
                  !signupInput.email.trim() ||
                  !signupInput.password
                }
                onClick={handleRegistration}
              >
                {registerIsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending verification code...
                  </>
                ) : (
                  "Continue with email"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Log in to continue learning on SkillNest.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={loginInput.email}
                  onChange={(event) => changeInputHandler(event, "login")}
                  placeholder="aryan123@gmail.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={loginInput.password}
                  onChange={(event) => changeInputHandler(event, "login")}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                {googleIsLoading ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Google...
                  </Button>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width={googleButtonWidth}
                  />
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                className="w-full"
                disabled={
                  loginIsLoading ||
                  !loginInput.email.trim() ||
                  !loginInput.password
                }
                onClick={handleLogin}
              >
                {loginIsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Login;

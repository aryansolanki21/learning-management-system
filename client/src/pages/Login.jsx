import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

/* ---------- Shared styles ---------- */

// Horizontal padding for every card section, so all of them line up.
const padX = "px-6 sm:px-8";

const cardClass =
  "w-full max-w-md gap-6 rounded-2xl border border-slate-200 bg-white py-6 shadow-sm ring-0 sm:py-8";

const headerClass = `${padX} gap-1.5`;

const titleClass =
  "text-2xl font-bold leading-tight tracking-tight text-slate-900";

const descriptionClass = "text-sm text-slate-600";

const primaryButtonClass =
  "h-11 w-full rounded-full bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none";

const inputClass =
  "h-11 rounded-xl border-slate-200 bg-slate-50/70 transition-colors placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/30";

const tabTriggerClass =
  "rounded-full text-sm text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-active:bg-white data-active:text-slate-900 data-active:shadow-sm";

const footerClass = `justify-center border-t-0 bg-transparent p-0 pb-6 sm:pb-8 ${padX}`;

const linkButtonClass =
  "font-semibold text-blue-600 hover:text-blue-700 hover:underline";

/* ---------- Small building blocks ---------- */

const AuthPage = ({ children }) => (
  <div className="flex min-h-[calc(100vh-5rem)] w-full justify-center bg-slate-100 px-4 pt-8 pb-12 sm:items-center sm:py-16">
    {children}
  </div>
);

const Divider = ({ label }) => (
  <div className="flex items-center gap-3">
    <Separator className="flex-1 bg-slate-200" />
    <span className="text-xs text-slate-500">{label}</span>
    <Separator className="flex-1 bg-slate-200" />
  </div>
);

const PasswordField = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        className={`${inputClass} pr-11`}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

const SubmitContent = ({ loading, loadingText, children }) =>
  loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {loadingText}
    </>
  ) : (
    children
  );

/* ---------- Page ---------- */

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedTab =
    searchParams.get("tab") === "signup" ? "signup" : "login";

  const [signupInput, setSignupInput] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loginInput, setLoginInput] = useState({ email: "", password: "" });

  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [googleButtonWidth, setGoogleButtonWidth] = useState(() => {
    if (typeof window === "undefined") return "384";
    return window.matchMedia("(max-width: 480px)").matches ? "280" : "384";
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

  const switchTab = (value) => {
    if (value !== "login" && value !== "signup") return;

    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set("tab", value);
        return nextParams;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 480px)");

    const handleWidthChange = (event) => {
      setGoogleButtonWidth(event.matches ? "280" : "384");
    };

    mediaQuery.addEventListener("change", handleWidthChange);
    return () => mediaQuery.removeEventListener("change", handleWidthChange);
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
    const update = (current) => ({ ...current, [name]: value });

    if (type === "signup") setSignupInput(update);
    else setLoginInput(update);
  };

  const handleRegistration = async () => {
    try {
      const result = await registerUser(signupInput).unwrap();

      setPendingEmail(signupInput.email.trim().toLowerCase());
      setOtp("");
      setShowVerification(true);
      setResendCooldown(60);

      toast.add({
        type: "success",
        title: result.message || "Check your email for the verification code.",
      });
    } catch (error) {
      toast.add({
        type: "error",
        title: getErrorMessage(error, "Signup failed."),
      });

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
      const result = await verifyEmailOtp({ email: pendingEmail, otp }).unwrap();

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
      if (error?.status === 429) {
        const retryAfter = Number(error?.data?.retryAfterSeconds);
        setResendCooldown(Math.max(1, retryAfter || resendCooldown || 60));
      }

      toast.add({
        type: "error",
        title: getErrorMessage(error, "Unable to resend the verification code."),
      });
    }
  };

  const submitWith = (handler) => (event) => {
    event.preventDefault();
    handler();
  };

  const googleSection = (text) =>
    googleIsLoading ? (
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-full"
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Signing in with Google...
      </Button>
    ) : (
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          size="large"
          text={text}
          shape="pill"
          width={googleButtonWidth}
        />
      </div>
    );

  /* ----- Email verification ----- */

  if (showVerification) {
    return (
      <AuthPage>
        <Card className={cardClass}>
          <CardHeader className={headerClass}>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MailCheck size={24} />
            </div>

            <CardTitle className={titleClass}>Verify your email</CardTitle>

            <CardDescription className={`${descriptionClass} leading-relaxed`}>
              Enter the six-digit code we sent to{" "}
              <span className="font-medium text-slate-900">{pendingEmail}</span>
              . The code expires in 10 minutes.
            </CardDescription>
          </CardHeader>

          <CardContent className={padX}>
            <form
              className="space-y-4"
              onSubmit={submitWith(handleVerifyEmail)}
            >
              <div className="space-y-2">
                <Label htmlFor="verification-otp">Verification code</Label>
                <Input
                  id="verification-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={verifyIsLoading}
                  className={`${inputClass} h-12 text-center text-xl font-semibold tracking-[0.5em]`}
                />
              </div>

              <Button
                type="submit"
                className={primaryButtonClass}
                disabled={verifyIsLoading || otp.length !== 6}
              >
                <SubmitContent
                  loading={verifyIsLoading}
                  loadingText="Verifying..."
                >
                  Verify email
                </SubmitContent>
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-600">
              Didn't receive the code?
              <Button
                type="button"
                variant="link"
                className="h-auto px-1.5 py-0 font-semibold text-blue-600"
                disabled={resendIsLoading || resendCooldown > 0}
                onClick={handleResendOtp}
              >
                {resendIsLoading
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
              </Button>
            </div>
          </CardContent>

          <CardFooter className={`${footerClass} -mt-2`}>
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-full text-slate-600"
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
      </AuthPage>
    );
  }

  /* ----- Login / Signup ----- */

  return (
    <AuthPage>
      <Tabs
        value={requestedTab}
        onValueChange={switchTab}
        className="w-full max-w-md"
      >
        <Card className={`${cardClass} max-w-none`}>
          <div className={padX}>
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-slate-100 p-1">
              <TabsTrigger value="login" className={tabTriggerClass}>
                Log in
              </TabsTrigger>
              <TabsTrigger value="signup" className={tabTriggerClass}>
                Sign up
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Login */}
          <TabsContent value="login" className="mt-2 flex flex-col gap-6">
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>Welcome back</CardTitle>
              <CardDescription className={descriptionClass}>
                Log in to continue learning on SkillNest.
              </CardDescription>
            </CardHeader>

            <CardContent className={`${padX} flex flex-col gap-6`}>
              <form className="space-y-4" onSubmit={submitWith(handleLogin)}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={loginInput.email}
                    onChange={(event) => changeInputHandler(event, "login")}
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <PasswordField
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
                    value={loginInput.password}
                    onChange={(event) => changeInputHandler(event, "login")}
                    placeholder="Enter your password"
                  />
                </div>

                <Button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={
                    loginIsLoading ||
                    !loginInput.email.trim() ||
                    !loginInput.password
                  }
                >
                  <SubmitContent
                    loading={loginIsLoading}
                    loadingText="Logging in..."
                  >
                    Log in
                  </SubmitContent>
                </Button>
              </form>

              <div className="space-y-5">
                <Divider label="or continue with" />
                {googleSection("continue_with")}
              </div>
            </CardContent>

            <CardFooter className={footerClass}>
              <p className="text-center text-sm text-slate-600">
                New to SkillNest?{" "}
                <button
                  type="button"
                  className={linkButtonClass}
                  onClick={() => switchTab("signup")}
                >
                  Create an account
                </button>
              </p>
            </CardFooter>
          </TabsContent>

          {/* Signup */}
          <TabsContent value="signup" className="mt-2 flex flex-col gap-6">
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>Create your account</CardTitle>
              <CardDescription className={descriptionClass}>
                We'll email you a code to verify your address.
              </CardDescription>
            </CardHeader>

            <CardContent className={`${padX} flex flex-col gap-6`}>
              <form
                className="space-y-4"
                onSubmit={submitWith(handleRegistration)}
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={signupInput.name}
                    onChange={(event) => changeInputHandler(event, "signup")}
                    placeholder="Your full name"
                    className={inputClass}
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
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <PasswordField
                    id="signup-password"
                    name="password"
                    autoComplete="new-password"
                    value={signupInput.password}
                    onChange={(event) => changeInputHandler(event, "signup")}
                    placeholder="Create a password"
                    minLength={6}
                  />
                  <p className="text-xs leading-relaxed text-slate-500">
                    At least 6 characters, with an uppercase letter, a
                    lowercase letter, and a number.
                  </p>
                </div>

                <Button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={
                    registerIsLoading ||
                    !signupInput.name.trim() ||
                    !signupInput.email.trim() ||
                    !signupInput.password
                  }
                >
                  <SubmitContent
                    loading={registerIsLoading}
                    loadingText="Sending code..."
                  >
                    Continue with email
                  </SubmitContent>
                </Button>
              </form>

              <div className="space-y-5">
                <Divider label="or sign up with" />
                {googleSection("signup_with")}
              </div>
            </CardContent>

            <CardFooter className={footerClass}>
              <p className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  className={linkButtonClass}
                  onClick={() => switchTab("login")}
                >
                  Log in
                </button>
              </p>
            </CardFooter>
          </TabsContent>
        </Card>
      </Tabs>
    </AuthPage>
  );
};

export default Login;
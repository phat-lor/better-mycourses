"use client";

import {
  addToast,
  Button,
  Divider,
  Form,
  Input,
  ResizablePanel,
} from "@heroui/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { ArrowLeft, ArrowRight, Key, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sessionAPI } from "@/utils/api";

type AuthStep = "options" | "username" | "password" | "session";

export default function Component() {
  const [currentStep, setCurrentStep] = useState<AuthStep>("options");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await sessionAPI.checkSession();
        if (response.data?.success && response.data?.isAuthenticated) {
          // User is already authenticated, redirect to home
          router.push("/app/home");
          return;
        }
      } catch {
        // If check fails, user is not authenticated, continue to auth page
      }
      setIsCheckingAuth(false);
    };

    checkAuthentication();
  }, [router]);

  const variants = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 10 },
  };

  const orDivider = (
    <div className="flex items-center gap-4 py-2">
      <Divider className="flex-1" />
      <p className="text-tiny text-default-500 shrink-0">OR</p>
      <Divider className="flex-1" />
    </div>
  );

  const handleUsernameNext = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const usernameValue = (event.target as HTMLFormElement).username.value;
    if (usernameValue.trim()) {
      setUsername(usernameValue.trim());
      setCurrentStep("password");
    }
  };

  const handleCredentialsLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const passwordValue = (event.target as HTMLFormElement).password.value;

    if (!passwordValue.trim()) return;

    setIsLoading(true);

    try {
      const response = await sessionAPI.loginWithCredentials(
        username,
        passwordValue,
      );

      if (response.data?.success) {
        addToast({
          description: response.data?.message || "Login successful",
          color: "success",
        });

        // Small delay to ensure cookies are set before redirect
        setTimeout(() => {
          // Force a hard navigation to ensure proper initialization
          window.location.href = "/app/home";
        }, 200);
      } else {
        addToast({
          description: response.data?.message || "Login failed",
          color: "danger",
        });
      }
    } catch {
      addToast({
        description: "Network error. Please try again.",
        color: "danger",
      });
    }

    setIsLoading(false);
  };

  const handleSessionLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);

    const response = await sessionAPI.login(
      (event.target as HTMLFormElement).moodleSession.value,
    );

    if (response.data?.success && response.data?.message) {
      addToast({
        description: response.data?.message || "Login successful",
        color: "success",
      });

      // Small delay to ensure cookies are set before redirect
      setTimeout(() => {
        // Force a hard navigation to ensure proper initialization
        window.location.href = "/app/home";
      }, 200);
    } else {
      addToast({
        description: response.data?.message || "Login failed",
        color: "danger",
      });
    }

    setIsLoading(false);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="rounded-large bg-content1 shadow-small flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="rounded-large bg-content1 shadow-small flex w-full max-w-sm flex-col gap-4 p-6">
        <ResizablePanel>
          <AnimatePresence initial={false} mode="popLayout">
            <LazyMotion features={domAnimation}>
              {/* Options Step */}
              {currentStep === "options" && (
                <m.div
                  animate="visible"
                  className="flex flex-col gap-y-3"
                  exit="hidden"
                  initial="hidden"
                  variants={variants}
                >
                  <Button
                    fullWidth
                    color="primary"
                    startContent={<User className="text-2xl" />}
                    onPress={() => setCurrentStep("username")}
                  >
                    Continue with Credentials
                  </Button>
                  {orDivider}
                  <Button
                    fullWidth
                    startContent={
                      <Key className="text-default-500" size={24} />
                    }
                    variant="flat"
                    onPress={() => setCurrentStep("session")}
                  >
                    Continue with Session
                  </Button>
                </m.div>
              )}

              {/* Username Step */}
              {currentStep === "username" && (
                <m.div
                  animate="visible"
                  className="flex flex-col gap-y-3"
                  exit="hidden"
                  initial="hidden"
                  variants={variants}
                >
                  <Form
                    validationBehavior="native"
                    onSubmit={handleUsernameNext}
                  >
                    <Input
                      autoFocus
                      isRequired
                      label="University Username"
                      name="username"
                      placeholder="u6888056"
                      aria-label="University Username"
                      startContent={
                        <User className="text-default-500" size={18} />
                      }
                      variant="bordered"
                    />
                    <Button
                      className="w-full"
                      color="primary"
                      endContent={<ArrowRight size={18} />}
                      type="submit"
                    >
                      Next
                    </Button>
                  </Form>
                  <Button
                    fullWidth
                    startContent={
                      <ArrowLeft className="text-default-500" size={18} />
                    }
                    variant="flat"
                    onPress={() => setCurrentStep("options")}
                  >
                    Back
                  </Button>
                </m.div>
              )}

              {/* Password Step */}
              {currentStep === "password" && (
                <m.div
                  animate="visible"
                  className="flex flex-col gap-y-3"
                  exit="hidden"
                  initial="hidden"
                  variants={variants}
                >
                  <Form
                    validationBehavior="native"
                    onSubmit={handleCredentialsLogin}
                  >
                    <Input
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      aria-label="Username"
                      startContent={
                        <User className="text-default-500" size={18} />
                      }
                      variant="bordered"
                      classNames={{
                        input: "text-default-600",
                        inputWrapper: "bg-default-100",
                      }}
                    />
                    <Input
                      autoFocus
                      isRequired
                      label="Password"
                      name="password"
                      type="password"
                      aria-label="Password"
                      startContent={
                        <Lock className="text-default-500" size={18} />
                      }
                      variant="bordered"
                    />
                    <Button
                      className="w-full"
                      color="primary"
                      isLoading={isLoading}
                      type="submit"
                    >
                      Log In
                    </Button>
                  </Form>
                  <Button
                    fullWidth
                    startContent={
                      <ArrowLeft className="text-default-500" size={18} />
                    }
                    variant="flat"
                    onPress={() => setCurrentStep("username")}
                  >
                    Back
                  </Button>
                </m.div>
              )}

              {/* Session Step */}
              {currentStep === "session" && (
                <m.div
                  animate="visible"
                  className="flex flex-col gap-y-3"
                  exit="hidden"
                  initial="hidden"
                  variants={variants}
                >
                  <Form
                    validationBehavior="native"
                    onSubmit={handleSessionLogin}
                  >
                    <Input
                      autoFocus
                      isRequired
                      label="Moodle Session"
                      name="moodleSession"
                      aria-label="Moodle Session"
                      startContent={
                        <Key className="text-default-500" size={18} />
                      }
                      variant="bordered"
                    />
                    <Button
                      className="w-full"
                      color="primary"
                      isLoading={isLoading}
                      type="submit"
                    >
                      Log In
                    </Button>
                  </Form>
                  <Button
                    fullWidth
                    startContent={
                      <ArrowLeft className="text-default-500" size={18} />
                    }
                    variant="flat"
                    onPress={() => setCurrentStep("options")}
                  >
                    Back
                  </Button>
                </m.div>
              )}
            </LazyMotion>
          </AnimatePresence>
        </ResizablePanel>
      </div>
    </div>
  );
}

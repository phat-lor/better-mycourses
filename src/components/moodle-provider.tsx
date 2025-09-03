"use client";

import { Progress } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { sessionAPI } from "@/utils/api";
import useSessionStore from "@/utils/sessionStore";
import useUserStore from "@/utils/userStore";

interface MoodleProviderProps {
  children: React.ReactNode;
}

export function MoodleProvider({ children }: MoodleProviderProps) {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing...");

  const { session, clearSession, setLoading } = useSessionStore();
  const {
    setLoading: setUserLoading,
    setUser,
    setCourses,
    setAttendance,
    clearUser,
  } = useUserStore();

  const onInit = useCallback(async () => {
    setLoading(true);
    setUserLoading(true);
    setLoadingProgress(10);
    setCurrentStep("Checking session...");

    try {
      const response = await sessionAPI.checkSession();
      setLoadingProgress(20);

      if (!response.data?.success || !response.data?.isAuthenticated) {
        clearSession();
        clearUser();
        router.push("/app/auth");
        return;
      }

      if (response.data?.sesskey && session.token) {
        if (response.data?.sesskeyChanged) {
          // JWT token should be refreshed if sesskey changed, but for now we'll keep the existing token
          // In a production app, you might want to request a new token here
        }
      }

      setLoadingProgress(30);
      setCurrentStep("Fetching user profile...");

      // Fetch user profile data when authenticated
      try {
        const profileResponse = await sessionAPI.getUserProfile();
        setLoadingProgress(40);
        setCurrentStep("Processing profile data...");

        if (profileResponse.data?.success && profileResponse.data?.profile) {
          setUser({
            firstName: profileResponse.data.profile.firstName,
            lastName: profileResponse.data.profile.lastName,
            email: profileResponse.data.profile.email,
            courses: [],
          });

          setLoadingProgress(50);
          setCurrentStep("Fetching courses list...");
          // Fetch courses data
          try {
            const coursesResponse = await sessionAPI.getCourses();
            setLoadingProgress(60);
            setCurrentStep("Processing courses data...");

            if (
              coursesResponse.data?.success &&
              coursesResponse.data?.courses
            ) {
              const courses = coursesResponse.data.courses;
              setCourses(courses);

              setLoadingProgress(70);
              // Fetch attendance data for each course with detailed progress
              const totalCourses = courses.length;
              setCurrentStep(`Reading attendance 0/${totalCourses}`);

              for (let i = 0; i < courses.length; i++) {
                const course = courses[i];
                const currentIndex = i + 1;

                setCurrentStep(
                  `Reading attendance ${currentIndex}/${totalCourses} - ${course.fullname || course.shortname || `Course ${course.id}`}`,
                );

                try {
                  const attendanceResponse = await sessionAPI.getAttendance(
                    course.id.toString(),
                  );
                  if (
                    attendanceResponse.data?.success &&
                    attendanceResponse.data?.attendance
                  ) {
                    setAttendance(
                      course.id,
                      attendanceResponse.data.attendance,
                    );
                  }
                } catch (attendanceError) {
                  console.error(
                    `Failed to fetch attendance for course ${course.id}:`,
                    attendanceError,
                  );
                }

                const attendanceProgress =
                  70 + (currentIndex / totalCourses) * 20;
                setLoadingProgress(attendanceProgress);
              }
            }
          } catch (coursesError) {
            console.error("Failed to fetch courses:", coursesError);
          }
        }
      } catch (profileError) {
        console.error("Failed to fetch user profile:", profileError);
      }

      setCurrentStep("Finalizing...");
      setLoadingProgress(100);
    } catch {
      clearSession();
      clearUser();
      router.push("/app/auth");
    } finally {
      setLoading(false);
      setUserLoading(false);
      setIsInitializing(false);
    }
  }, [
    clearSession,
    clearUser,
    router,
    session.token,
    setLoading,
    setUserLoading,
    setUser,
    setCourses,
    setAttendance,
  ]);

  useEffect(() => {
    onInit();
  }, [onInit]);

  return (
    <>
      <AnimatePresence>
        {isInitializing && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
          >
            <div className="flex flex-col items-center justify-center h-full max-w-sm w-full mx-auto space-y-12">
              {/* Hero Text */}
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-light text-foreground mb-2">
                  Adderall
                </h1>
                <p className="text-sm text-foreground/60">
                  The MyCourses it could be.
                </p>
              </div>

              {/* Center Loading Area */}
              <div className="flex flex-col items-center gap-6 w-full">
                <Progress
                  value={loadingProgress}
                  color="default"
                  size="sm"
                  className="w-full max-w-xs"
                  aria-label="Loading progress"
                  aria-describedby="loading-status"
                />
              </div>
            </div>

            {/* Bottom Status Text */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <p
                id="loading-status"
                className="text-xs text-foreground/50 text-center"
              >
                {currentStep}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}

"use client";

import { Progress } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { sessionAPI } from "@/utils/api";
import useSessionStore from "@/utils/sessionStore";
import useUserStore from "@/utils/userStore";

interface MoodleProviderProps {
  children: React.ReactNode;
}

// Retry utility function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  description: string = "operation",
  onRetry?: (attempt: number, delay: number) => void,
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        console.error(
          `${description} failed after ${maxRetries + 1} attempts:`,
          error,
        );
        throw lastError;
      }

      const delay = baseDelay * 2 ** attempt;
      console.warn(
        `${description} attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error,
      );

      if (onRetry) {
        onRetry(attempt + 1, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function MoodleProvider({ children }: MoodleProviderProps) {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing...");
  const initRef = useRef(false);
  const mountedRef = useRef(false);

  const {
    session,
    clearSession,
    setLoading,
    isBackgroundSyncing,
    setBackgroundSyncing,
    setSyncProgress,
    clearSyncProgress,
    forceSyncRequested,
    clearForceSync,
  } = useSessionStore();
  const {
    setLoading: setUserLoading,
    setUser,
    setCourses,
    setAttendance,
    clearUser,
    setProfileSyncing,
    setCoursesSyncing,
    setAttendanceSyncing,
    clearAllSyncStatus,
  } = useUserStore();

  const onInit = useCallback(
    async (isForceSync = false) => {
      // Prevent multiple simultaneous initializations
      if (initRef.current || isBackgroundSyncing) return;
      initRef.current = true;

      // Check if we have existing user data in localStorage
      // We'll get fresh user state inside the function to avoid dependencies
      const currentUser = useUserStore.getState().user;
      const hasExistingData =
        currentUser?.courses && currentUser.courses.length > 0;
      const shouldShowSplash = !hasExistingData && !isForceSync;

      if (shouldShowSplash) {
        setLoading(true);
        setUserLoading(true);
        setLoadingProgress(10);
        setCurrentStep("Checking session...");
      } else {
        // Skip splash, sync in background
        setIsInitializing(false);
        setBackgroundSyncing(true);
        if (isForceSync) {
          setSyncProgress("Force refreshing...", 10);
        } else {
          setSyncProgress("Checking session...", 10);
        }
      }

      try {
        const response = await retryWithBackoff(
          () => sessionAPI.checkSession(),
          3,
          1000,
          "Session check",
          (attempt, _delay) => {
            if (!shouldShowSplash) {
              setSyncProgress(`Session check retry ${attempt}/3...`, 10);
            }
          },
        );

        if (shouldShowSplash) {
          setLoadingProgress(20);
        } else {
          setSyncProgress("Session verified", 20);
        }

        if (!response.data?.success || !response.data?.isAuthenticated) {
          clearSession();
          clearUser();
          clearSyncProgress();
          router.push("/app/auth");
          return;
        }

        if (response.data?.sesskey && session.token) {
          if (response.data?.sesskeyChanged) {
            // JWT token should be refreshed if sesskey changed, but for now we'll keep the existing token
            // In a production app, you might want to request a new token here
          }
        }

        if (shouldShowSplash) {
          setLoadingProgress(30);
          setCurrentStep("Fetching user profile...");
        } else {
          setSyncProgress("Updating profile...", 30);
        }

        // Fetch user profile data when authenticated
        try {
          // Set profile syncing status
          if (!shouldShowSplash) {
            setProfileSyncing(true);
          }

          const profileResponse = await retryWithBackoff(
            () => sessionAPI.getUserProfile(),
            3,
            1000,
            "User profile",
            (attempt, _delay) => {
              if (!shouldShowSplash) {
                setSyncProgress(`Profile retry ${attempt}/3...`, 30);
              }
            },
          );

          if (shouldShowSplash) {
            setLoadingProgress(40);
            setCurrentStep("Processing profile data...");
          } else {
            setSyncProgress("Profile updated", 40);
          }

          if (profileResponse.data?.success && profileResponse.data?.profile) {
            // Only update profile data, preserve existing courses
            const existingCourses = hasExistingData ? currentUser.courses : [];
            setUser({
              firstName: profileResponse.data.profile.firstName,
              lastName: profileResponse.data.profile.lastName,
              email: profileResponse.data.profile.email,
              courses: existingCourses,
            });

            // Clear profile syncing status
            if (!shouldShowSplash) {
              setProfileSyncing(false);
            }

            if (shouldShowSplash) {
              setLoadingProgress(50);
              setCurrentStep("Fetching courses list...");
            } else {
              setSyncProgress("Syncing courses...", 50);
            }

            // Fetch courses data
            try {
              // Set courses syncing status
              if (!shouldShowSplash) {
                setCoursesSyncing(true);
              }

              const coursesResponse = await retryWithBackoff(
                () => sessionAPI.getCourses(),
                3,
                1000,
                "Courses list",
                (attempt, _delay) => {
                  if (!shouldShowSplash) {
                    setSyncProgress(`Courses retry ${attempt}/3...`, 50);
                  }
                },
              );

              if (shouldShowSplash) {
                setLoadingProgress(60);
                setCurrentStep("Processing courses data...");
              } else {
                setSyncProgress("Courses synced", 60);
              }

              if (
                coursesResponse.data?.success &&
                coursesResponse.data?.courses
              ) {
                const courses = coursesResponse.data.courses;

                // For background sync, preserve existing attendance data
                if (!shouldShowSplash && hasExistingData) {
                  const existingCourses = currentUser.courses;
                  const mergedCourses = courses.map((newCourse) => {
                    const existingCourse = existingCourses.find(
                      (c) => c.id === newCourse.id,
                    );
                    return existingCourse
                      ? { ...newCourse, attendance: existingCourse.attendance }
                      : newCourse;
                  });
                  setCourses(mergedCourses);
                } else {
                  setCourses(courses);
                }

                // Clear courses syncing status
                if (!shouldShowSplash) {
                  setCoursesSyncing(false);
                }

                if (shouldShowSplash) {
                  setLoadingProgress(70);
                } else {
                  setSyncProgress("Syncing attendance...", 70);
                }

                // Fetch attendance data for each course with detailed progress
                const totalCourses = courses.length;

                if (shouldShowSplash) {
                  setCurrentStep(`Reading attendance 0/${totalCourses}`);
                }

                for (let i = 0; i < courses.length; i++) {
                  const course = courses[i];
                  const currentIndex = i + 1;

                  const stepMessage = `Reading attendance ${currentIndex}/${totalCourses} - ${course.fullname || course.shortname || `Course ${course.id}`}`;

                  if (shouldShowSplash) {
                    setCurrentStep(stepMessage);
                  } else {
                    setSyncProgress(
                      stepMessage,
                      70 + (currentIndex / totalCourses) * 20,
                    );
                  }

                  try {
                    // Set attendance syncing status for this course
                    if (!shouldShowSplash) {
                      setAttendanceSyncing(course.id, true);
                    }

                    const attendanceResponse = await retryWithBackoff(
                      () => sessionAPI.getAttendance(course.id.toString()),
                      3,
                      1000,
                      `Attendance for course ${course.shortname || course.id}`,
                      (attempt, _delay) => {
                        if (!shouldShowSplash) {
                          setSyncProgress(
                            `${course.shortname || `Course ${course.id}`} attendance retry ${attempt}/3...`,
                            70 + (currentIndex / totalCourses) * 20,
                          );
                        }
                      },
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

                    // Clear attendance syncing status for this course
                    if (!shouldShowSplash) {
                      setAttendanceSyncing(course.id, false);
                    }
                  } catch (attendanceError) {
                    console.error(
                      `Failed to fetch attendance for course ${course.id} after retries:`,
                      attendanceError,
                    );
                    // Clear syncing status even on error
                    if (!shouldShowSplash) {
                      setAttendanceSyncing(course.id, false);
                    }
                  }

                  if (shouldShowSplash) {
                    const attendanceProgress =
                      70 + (currentIndex / totalCourses) * 20;
                    setLoadingProgress(attendanceProgress);
                  }
                }
              }
            } catch (coursesError) {
              console.error("Failed to fetch courses:", coursesError);
              // Clear courses syncing status on error
              if (!shouldShowSplash) {
                setCoursesSyncing(false);
              }
            }
          }
        } catch (profileError) {
          console.error("Failed to fetch user profile:", profileError);
          // Clear profile syncing status on error
          if (!shouldShowSplash) {
            setProfileSyncing(false);
          }
        }

        if (shouldShowSplash) {
          setCurrentStep("Finalizing...");
          setLoadingProgress(100);
        } else {
          setSyncProgress("Sync complete", 100);
          // Clear all sync statuses and progress after a brief delay
          setTimeout(() => {
            clearSyncProgress();
            clearAllSyncStatus();
          }, 2000);
        }
      } catch {
        clearSession();
        clearUser();
        clearSyncProgress();
        clearAllSyncStatus();
        router.push("/app/auth");
      } finally {
        if (shouldShowSplash) {
          setLoading(false);
          setUserLoading(false);
          setIsInitializing(false);
        }
        // Reset the ref to allow future initializations if needed
        initRef.current = false;
      }
    },
    [
      session.token,
      isBackgroundSyncing,
      router,
      clearSession,
      clearUser,
      setLoading,
      setUserLoading,
      setUser,
      setCourses,
      setAttendance,
      setBackgroundSyncing,
      setSyncProgress,
      clearSyncProgress,
      setProfileSyncing,
      setCoursesSyncing,
      setAttendanceSyncing,
      clearAllSyncStatus,
    ],
  );

  useEffect(() => {
    // Run initialization only once on mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      onInit();
    }
  }, [onInit]);

  // Watch for force sync requests
  useEffect(() => {
    if (forceSyncRequested && !isBackgroundSyncing) {
      // Clear the force sync flag immediately
      clearForceSync();

      // Clear all data for fresh sync
      clearAllSyncStatus();
      clearUser();

      // Trigger background sync (force sync = true means no splash screen)
      onInit(true); // true = isForceSync
    }
  }, [
    forceSyncRequested,
    isBackgroundSyncing,
    clearForceSync,
    clearAllSyncStatus,
    clearUser,
    onInit,
  ]);

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

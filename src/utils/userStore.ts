import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AssignmentComment,
  AssignmentDates,
  AssignmentGrading,
  AssignmentInfo,
  AssignmentSettings,
  AssignmentSubmission,
  CourseActivity,
  CourseContent,
  CourseSection,
  QuizAttempt,
  QuizInfo,
  SubmissionFile,
} from "./moodleParser";

interface Attendance {
  date: string;
  status: string;
}

interface Course {
  id: number;
  fullname: string;
  shortname: string;
  idnumber: string;
  summary: string;
  summaryformat: number;
  startdate: number;
  enddate: number;
  visible: boolean;
  showactivitydates?: boolean;
  showcompletionconditions?: boolean;
  pdfexportfont?: string;
  fullnamedisplay: string;
  viewurl: string;
  courseimage: string;
  progress: number;
  hasprogress: boolean;
  isfavourite: boolean;
  hidden: boolean;
  showshortname: boolean;
  coursecategory: string;
  attendance?: Attendance[];
  content?: CourseContent;
  // Activity data caches
  quizzes?: { [moduleId: string]: QuizInfo };
  assignments?: { [moduleId: string]: AssignmentInfo };
}

interface User {
  firstName: string;
  lastName: string;
  email: string;
  courses: Course[];
}

interface SyncStatus {
  profileSyncing: boolean;
  coursesSyncing: boolean;
  attendanceSyncing: { [courseId: number]: boolean };
  activitySyncing: { [moduleId: string]: boolean };
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
}

interface UserActions {
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  updateCourse: (courseId: number, updates: Partial<Course>) => void;
  removeCourse: (courseId: number) => void;
  toggleCourseFavorite: (courseId: number) => void;
  toggleCourseHidden: (courseId: number) => void;
  updateCourseProgress: (courseId: number, progress: number) => void;
  addAttendance: (courseId: number, attendance: Attendance) => void;
  setAttendance: (courseId: number, attendance: Attendance[]) => void;
  setCourseContent: (courseId: number, content: CourseContent) => void;
  updateCourseSection: (
    courseId: number,
    sectionId: string,
    updates: Partial<CourseSection>,
  ) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProfileSyncing: (syncing: boolean) => void;
  setCoursesSyncing: (syncing: boolean) => void;
  setAttendanceSyncing: (courseId: number, syncing: boolean) => void;
  setActivitySyncing: (moduleId: string, syncing: boolean) => void;
  setQuizInfo: (courseId: number, moduleId: string, quizInfo: QuizInfo) => void;
  setAssignmentInfo: (
    courseId: number,
    moduleId: string,
    assignmentInfo: AssignmentInfo,
  ) => void;
  updateActivityData: (
    courseId: number,
    moduleId: string,
    data: { quizInfo?: QuizInfo; assignmentInfo?: AssignmentInfo },
  ) => void;
  clearAllSyncStatus: () => void;
}

type UserStore = UserState & UserActions;

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      syncStatus: {
        profileSyncing: false,
        coursesSyncing: false,
        attendanceSyncing: {},
        activitySyncing: {},
      },

      setUser: (user) => set({ user, error: null }),

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      setCourses: (courses) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, courses } });
        }
      },

      addCourse: (course) => {
        const { user } = get();
        if (user) {
          const existingCourse = user.courses.find((c) => c.id === course.id);
          if (!existingCourse) {
            set({
              user: {
                ...user,
                courses: [...user.courses, course],
              },
            });
          }
        }
      },

      updateCourse: (courseId, updates) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId ? { ...course, ...updates } : course,
              ),
            },
          });
        }
      },

      removeCourse: (courseId) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.filter((course) => course.id !== courseId),
            },
          });
        }
      },

      toggleCourseFavorite: (courseId) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? { ...course, isfavourite: !course.isfavourite }
                  : course,
              ),
            },
          });
        }
      },

      toggleCourseHidden: (courseId) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? { ...course, hidden: !course.hidden }
                  : course,
              ),
            },
          });
        }
      },

      updateCourseProgress: (courseId, progress) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      progress: Math.max(0, Math.min(100, progress)),
                    }
                  : course,
              ),
            },
          });
        }
      },

      addAttendance: (courseId, attendance) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      attendance: [...(course.attendance || []), attendance],
                    }
                  : course,
              ),
            },
          });
        }
      },

      setAttendance: (courseId, attendance) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      attendance,
                    }
                  : course,
              ),
            },
          });
        }
      },

      setCourseContent: (courseId, content) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      content,
                    }
                  : course,
              ),
            },
          });
        }
      },

      updateCourseSection: (courseId, sectionId, updates) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId && course.content
                  ? {
                      ...course,
                      content: {
                        ...course.content,
                        sections: course.content.sections.map((section) =>
                          section.id === sectionId
                            ? { ...section, ...updates }
                            : section,
                        ),
                      },
                    }
                  : course,
              ),
            },
          });
        }
      },

      clearUser: () =>
        set({
          user: null,
          error: null,
          syncStatus: {
            profileSyncing: false,
            coursesSyncing: false,
            attendanceSyncing: {},
            activitySyncing: {},
          },
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setProfileSyncing: (syncing) => {
        const { syncStatus } = get();
        set({ syncStatus: { ...syncStatus, profileSyncing: syncing } });
      },

      setCoursesSyncing: (syncing) => {
        const { syncStatus } = get();
        set({ syncStatus: { ...syncStatus, coursesSyncing: syncing } });
      },

      setAttendanceSyncing: (courseId, syncing) => {
        const { syncStatus } = get();
        set({
          syncStatus: {
            ...syncStatus,
            attendanceSyncing: {
              ...syncStatus.attendanceSyncing,
              [courseId]: syncing,
            },
          },
        });
      },

      setActivitySyncing: (moduleId, syncing) => {
        const { syncStatus } = get();
        set({
          syncStatus: {
            ...syncStatus,
            activitySyncing: {
              ...syncStatus.activitySyncing,
              [moduleId]: syncing,
            },
          },
        });
      },

      setQuizInfo: (courseId, moduleId, quizInfo) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      quizzes: {
                        ...course.quizzes,
                        [moduleId]: quizInfo,
                      },
                    }
                  : course,
              ),
            },
          });
        }
      },

      setAssignmentInfo: (courseId, moduleId, assignmentInfo) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      assignments: {
                        ...course.assignments,
                        [moduleId]: assignmentInfo,
                      },
                    }
                  : course,
              ),
            },
          });
        }
      },

      updateActivityData: (courseId, moduleId, data) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              courses: user.courses.map((course) => {
                if (course.id === courseId && course.content) {
                  return {
                    ...course,
                    content: {
                      ...course.content,
                      sections: course.content.sections.map((section) => ({
                        ...section,
                        activities: section.activities.map((activity) =>
                          activity.moduleId === moduleId
                            ? {
                                ...activity,
                                ...data,
                              }
                            : activity,
                        ),
                      })),
                    },
                    ...(data.quizInfo && {
                      quizzes: {
                        ...course.quizzes,
                        [moduleId]: data.quizInfo,
                      },
                    }),
                    ...(data.assignmentInfo && {
                      assignments: {
                        ...course.assignments,
                        [moduleId]: data.assignmentInfo,
                      },
                    }),
                  };
                }
                return course;
              }),
            },
          });
        }
      },

      clearAllSyncStatus: () => {
        set({
          syncStatus: {
            profileSyncing: false,
            coursesSyncing: false,
            attendanceSyncing: {},
            activitySyncing: {},
          },
        });
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export default useUserStore;

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Attendance {
  date: string;
  status: string;
}

interface CourseActivity {
  id: string;
  name: string;
  type: string;
  moduleId: string;
  url: string;
  description?: string;
  dueDate?: string;
  openDate?: string;
  closeDate?: string;
  availability?: string;
  icon?: string;
}

interface CourseSection {
  id: string;
  number: number;
  name: string;
  summary?: string;
  activities: CourseActivity[];
  collapsed?: boolean;
}

interface CourseContent {
  sections: CourseSection[];
  attendanceInfo?: {
    current: number;
    total: number;
    percentage: number;
  };
  aiLevel?: {
    level: number;
    description: string;
    color: string;
  };
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
}

interface User {
  firstName: string;
  lastName: string;
  email: string;
  courses: Course[];
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
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
}

type UserStore = UserState & UserActions;

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

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

      clearUser: () => set({ user: null, error: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: "user-store",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export default useUserStore;

import { treaty } from "@elysiajs/eden";
import type { App } from "@/app/api/[[...slugs]]/route";

// Get JWT token from localStorage
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

// Create API instance with authorization header
export const api = treaty<App>(
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000",
  {
    headers: {
      get Authorization() {
        const token = getAuthToken();
        return token ? `Bearer ${token}` : "";
      },
    },
  },
);

/**
 * Session management utilities
 */
export const sessionAPI = {
  /**
   * Authenticate with Moodle session and get JWT token
   */
  async login(moodleSession: string) {
    const response = await api.api.auth.session.post({
      moodleSession,
    });

    // Store JWT token if login successful
    if (response.data?.success && response.data?.token) {
      localStorage.setItem("authToken", response.data.token);
    }

    return response;
  },

  /**
   * Authenticate with university credentials via SAML and get JWT token
   */
  async loginWithCredentials(username: string, password: string) {
    const response = await api.api.auth.credentials.post({
      username,
      password,
    });

    // Store JWT token if login successful
    if (response.data?.success && response.data?.token) {
      localStorage.setItem("authToken", response.data.token);
    }

    return response;
  },

  /**
   * Check if current session is valid (requires JWT token)
   */
  async checkSession() {
    const response = await api.api.auth.check.get();
    return response;
  },

  /**
   * Get user profile data (requires authentication)
   */
  async getUserProfile() {
    const response = await api.api.user.profile.get();
    return response;
  },

  /**
   * Get enrolled courses (requires authentication)
   */
  async getCourses() {
    const response = await api.api.courses.get();
    return response;
  },

  /**
   * Get attendance records for a specific course (requires authentication)
   */
  async getAttendance(courseId: string) {
    const response = await api.api.attendance({ courseId }).get();
    return response;
  },

  /**
   * Get course content and structure (requires authentication)
   */
  async getCourseContent(courseId: string) {
    const response = await api.api.course({ courseId }).content.get();
    return response;
  },

  /**
   * Get quiz information and attempts (requires authentication)
   */
  async getQuizInfo(quizId: string) {
    const response = await api.api.quiz({ quizId }).get();
    return response;
  },

  /**
   * Get assignment information and submission status (requires authentication)
   */
  async getAssignmentInfo(assignmentId: string) {
    const response = await api.api.assignment({ assignmentId }).get();
    return response;
  },

  /**
   * Logout and clear JWT token
   */
  async logout() {
    const response = await api.api.auth.logout.post();

    // Clear stored JWT token
    localStorage.removeItem("authToken");

    return response;
  },
};

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Session {
  token: string | null;
  sesskey: string | null;
  moodleSession: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
}

interface SessionState {
  session: Session;
  isLoading: boolean;
}

interface SessionActions {
  setSession: (
    token: string,
    sesskey?: string,
    moodleSession?: string,
    expiresIn?: number,
  ) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  isSessionValid: () => boolean;
  updateSesskey: (sesskey: string) => void;
  updateMoodleSession: (moodleSession: string) => void;
}

type SessionStore = SessionState & SessionActions;

const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      session: {
        token: null,
        sesskey: null,
        moodleSession: null,
        isAuthenticated: false,
        expiresAt: null,
      },
      isLoading: false,

      setSession: (token, sesskey, moodleSession, expiresIn = 3600) => {
        const expiresAt = Date.now() + expiresIn * 1000;

        // Store JWT token in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", token);
        }

        set({
          session: {
            token,
            sesskey: sesskey || null,
            moodleSession: moodleSession || null,
            isAuthenticated: true,
            expiresAt,
          },
        });
      },

      clearSession: () => {
        // Clear JWT token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
        }

        set({
          session: {
            token: null,
            sesskey: null,
            moodleSession: null,
            isAuthenticated: false,
            expiresAt: null,
          },
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      isSessionValid: () => {
        const { session } = get();
        if (!session.token || !session.expiresAt) return false;
        return Date.now() < session.expiresAt;
      },

      updateSesskey: (sesskey) => {
        const { session } = get();
        set({ session: { ...session, sesskey } });
        set({ session: { ...session, expiresAt: Date.now() + 3600 * 1000 } });
      },

      updateMoodleSession: (moodleSession) => {
        const { session } = get();
        set({ session: { ...session, moodleSession } });
      },
    }),
    {
      name: "session-store",
      partialize: (state) => ({ session: state.session }),
    },
  ),
);

export default useSessionStore;

"use client";

import useUserStore from "@/utils/userStore";
import KPICard from "./kpi-card";

interface KPIData {
  title: string;
  value: string;
  percentage: number;
  status: "good" | "warn" | "danger";
  iconName: string;
  details?: string[];
  courseBreakdown?: Array<{
    courseName: string;
    shortname: string;
    attended: number;
    total: number;
    percentage: number;
    sessions: Array<{ date: string; status: string }>;
  }>;
}

export default function HomeDashboard() {
  const { user, isLoading } = useUserStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">No user data available</h1>
      </div>
    );
  }

  // Calculate attendance metrics
  const calculateAttendanceMetrics = () => {
    const coursesWithAttendance = user.courses.filter(
      (course) => course.attendance && course.attendance.length > 0,
    );

    if (coursesWithAttendance.length === 0) {
      return {
        overall: 0,
        details: [],
        totalSessions: 0,
        attendedSessions: 0,
        courseBreakdown: [],
      };
    }

    let totalSessions = 0;
    let attendedSessions = 0;
    const courseDetails: string[] = [];
    const courseBreakdown: Array<{
      courseName: string;
      shortname: string;
      attended: number;
      total: number;
      percentage: number;
      sessions: Array<{ date: string; status: string }>;
    }> = [];

    coursesWithAttendance.forEach((course) => {
      const attendance = course.attendance || [];
      const courseTotal = attendance.length;
      const courseAttended = attendance.filter(
        (session) =>
          session.status.toLowerCase() === "attend" ||
          session.status.toLowerCase().includes("present") ||
          session.status.toLowerCase().includes("p"),
      ).length;

      totalSessions += courseTotal;
      attendedSessions += courseAttended;

      if (courseTotal > 0) {
        const percentage = Math.round((courseAttended / courseTotal) * 100);
        courseDetails.push(
          `${course.shortname}: ${courseAttended}/${courseTotal} (${percentage}%)`,
        );

        courseBreakdown.push({
          courseName: course.fullname,
          shortname: course.shortname,
          attended: courseAttended,
          total: courseTotal,
          percentage,
          sessions: attendance,
        });
      }
    });

    const overall =
      totalSessions > 0
        ? Math.round((attendedSessions / totalSessions) * 100)
        : 0;

    return {
      overall,
      details: courseDetails,
      totalSessions,
      attendedSessions,
      courseBreakdown,
    };
  };

  // Calculate course completion metrics
  const calculateCompletionMetrics = () => {
    const coursesWithProgress = user.courses.filter(
      (course) => course.hasprogress,
    );

    if (coursesWithProgress.length === 0) {
      return { average: 0, details: [] };
    }

    const totalProgress = coursesWithProgress.reduce(
      (sum, course) => sum + course.progress,
      0,
    );
    const average = Math.round(totalProgress / coursesWithProgress.length);

    const details = coursesWithProgress.map(
      (course) => `${course.shortname}: ${course.progress}%`,
    );

    return { average, details };
  };

  const attendanceData = calculateAttendanceMetrics();
  const completionData = calculateCompletionMetrics();

  // Mock assignment data
  const assignmentData = {
    completed: 23,
    pending: 7,
    total: 30,
    percentage: Math.round((23 / 30) * 100),
  };

  const kpiData: KPIData[] = [
    {
      title: "Overall Attendance",
      value: `${attendanceData.attendedSessions}/${attendanceData.totalSessions} (${attendanceData.overall}%)`,
      percentage: attendanceData.overall,
      status:
        attendanceData.overall >= 80
          ? "good"
          : attendanceData.overall >= 60
            ? "warn"
            : "danger",
      iconName: "solar:calendar-mark-linear",
      details: attendanceData.details,
      courseBreakdown: attendanceData.courseBreakdown,
    },
    {
      title: "Assignment Progress",
      value: `${assignmentData.completed}/${assignmentData.total}`,
      percentage: assignmentData.percentage,
      status:
        assignmentData.percentage >= 80
          ? "good"
          : assignmentData.percentage >= 60
            ? "warn"
            : "danger",
      iconName: "solar:clipboard-check-linear",
      details: [
        `Completed: ${assignmentData.completed}`,
        `Pending: ${assignmentData.pending}`,
        `Total: ${assignmentData.total}`,
      ],
    },
    {
      title: "Course Completion",
      value: `${completionData.average}%`,
      percentage: completionData.average,
      status:
        completionData.average >= 80
          ? "good"
          : completionData.average >= 60
            ? "warn"
            : "danger",
      iconName: "solar:book-bookmark-linear",
      details: completionData.details,
    },
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-sm text-foreground/60">
          Here's your academic progress overview
        </p>
      </div>

      <dl className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} data={kpi} />
        ))}
      </dl>
    </div>
  );
}

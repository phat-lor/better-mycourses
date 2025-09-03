"use client";

import {
  Button,
  Card,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import useUserStore from "@/utils/userStore";

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

export default function Home() {
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
    <div className="container mx-auto ">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-sm text-foreground/60">
          Here's your academic progress overview
        </p>
      </div>

      <dl className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {kpiData.map(
          ({
            title,
            value,
            percentage,
            status,
            iconName,
            details,
            courseBreakdown,
          }) => (
            <Card
              key={title}
              className="border border-transparent p-4 dark:px-0  bg-card hover:bg-card/50 transition-colors"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border p-0.5",
                  {
                    "border-success-200 bg-success-50 dark:border-success-100":
                      status === "good",
                    "border-warning-200 bg-warning-50 dark:border-warning-100":
                      status === "warn",
                    "border-danger-200 bg-danger-50 dark:border-danger-100":
                      status === "danger",
                  },
                )}
              >
                {status === "good" ? (
                  <Icon
                    className="text-success-500"
                    icon={iconName}
                    width={20}
                  />
                ) : status === "warn" ? (
                  <Icon
                    className="text-warning-500"
                    icon={iconName}
                    width={20}
                  />
                ) : (
                  <Icon
                    className="text-danger-500"
                    icon={iconName}
                    width={20}
                  />
                )}
              </div>

              <div className="pt-1">
                <dt className="text-foreground/60 my-2 text-sm font-medium">
                  {title}
                </dt>
                <dd className="text-foreground text-2xl font-semibold">
                  {value}
                </dd>
                {percentage > 0 && (
                  <p className="text-xs text-foreground/50 mt-1">
                    {percentage}% completion
                  </p>
                )}
              </div>

              <Progress
                aria-label="progress"
                className="mt-3"
                color={
                  status === "good"
                    ? "success"
                    : status === "warn"
                      ? "warning"
                      : "danger"
                }
                value={percentage}
                size="sm"
              />

              {/* Info/Details trigger */}
              {title === "Overall Attendance" &&
              courseBreakdown &&
              courseBreakdown.length > 0 ? (
                <Popover placement="right" showArrow>
                  <PopoverTrigger>
                    <Button
                      isIconOnly
                      className="absolute top-3 right-3 w-auto rounded-full"
                      size="sm"
                      variant="light"
                    >
                      <Icon
                        height={16}
                        icon="solar:info-circle-linear"
                        width={16}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="px-2 py-2">
                      <div className="text-small font-bold mb-2">
                        {title} Details
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-3">
                        {courseBreakdown.map((course) => (
                          <div key={course.shortname} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <div className="text-tiny font-medium">
                                {course.shortname}
                              </div>
                              <div className="text-tiny text-foreground/60">
                                {course.attended}/{course.total} (
                                {course.percentage}%)
                              </div>
                            </div>
                            <Progress
                              value={course.percentage}
                              color={
                                course.percentage >= 80
                                  ? "success"
                                  : course.percentage >= 60
                                    ? "warning"
                                    : "danger"
                              }
                              size="sm"
                              className="w-full"
                            />
                            <div className="flex flex-wrap gap-1 mt-2">
                              {course.sessions.map((session, idx) => (
                                <div
                                  key={`${session.date}-${idx}`}
                                  className={cn(
                                    "w-3 h-3 rounded-full text-xs flex items-center justify-center",
                                    {
                                      "bg-success-500":
                                        session.status.toLowerCase() ===
                                        "attend",
                                      "bg-danger-500":
                                        session.status.toLowerCase() ===
                                        "absent",
                                      "bg-default-300": ![
                                        "attend",
                                        "absent",
                                      ].includes(session.status.toLowerCase()),
                                    },
                                  )}
                                  title={`${session.date}: ${session.status}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : details && details.length > 0 ? (
                <Tooltip
                  content={
                    <div className="px-1 py-2">
                      <div className="text-small font-bold mb-1">
                        {title} Breakdown
                      </div>
                      <div className="text-tiny space-y-1">
                        {details.map((detail) => (
                          <div key={detail}>{detail}</div>
                        ))}
                      </div>
                    </div>
                  }
                  placement="bottom"
                >
                  <Button
                    isIconOnly
                    className="absolute top-3 right-3 w-auto rounded-full"
                    size="sm"
                    variant="light"
                  >
                    <Icon
                      height={16}
                      icon="solar:info-circle-linear"
                      width={16}
                    />
                  </Button>
                </Tooltip>
              ) : null}

              <Dropdown
                classNames={{
                  content: "min-w-[120px]",
                }}
                placement="bottom-end"
              >
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="absolute top-3 right-9 w-auto rounded-full"
                    size="sm"
                    variant="light"
                  >
                    <Icon height={16} icon="solar:menu-dots-bold" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  itemClasses={{
                    title: "text-tiny",
                  }}
                  variant="flat"
                >
                  <DropdownItem key="view-details">View Details</DropdownItem>
                  <DropdownItem key="export-data">Export Data</DropdownItem>
                  <DropdownItem key="set-alert">Set Alert</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </Card>
          ),
        )}
      </dl>
    </div>
  );
}

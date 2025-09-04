"use client";
import { Card, CardBody, Chip, Progress } from "@heroui/react";
import { useMemo } from "react";
import { OverviewStat } from "./overview-components";
import type { StoreCourse } from "./types";

interface CourseAttendanceProps {
  course: StoreCourse;
}

export function CourseAttendance({ course }: CourseAttendanceProps) {
  const stats = useMemo(() => {
    if (!course.attendance) return null;
    const total = course.attendance.length;
    const attended = course.attendance.filter(
      (s) => s.status.toLowerCase() === "attend",
    ).length;
    const absent = course.attendance.filter(
      (s) => s.status.toLowerCase() === "absent",
    ).length;
    const other = total - attended - absent;
    return {
      total,
      attended,
      absent,
      other,
      percentage: Math.round((attended / total) * 100),
    };
  }, [course.attendance]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <Card className="border border-divider">
        <CardBody className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <OverviewStat label="Attended" value={stats.attended} />
            <OverviewStat label="Absent" value={stats.absent} />
            <OverviewStat label="Other" value={stats.other} />
            <div className="text-center">
              <p className="text-2xl font-semibold text-foreground">
                {stats.percentage}%
              </p>
              <p className="text-sm text-foreground/60">Rate</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={stats.percentage}
              size="sm"
              color={
                stats.percentage >= 80
                  ? "success"
                  : stats.percentage >= 60
                    ? "warning"
                    : "danger"
              }
              aria-label="Attendance rate"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="border border-divider">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {(course.attendance ?? []).map((session, i) => (
              <div
                key={`${session.date}-${i}`}
                className="flex items-center justify-between rounded-lg p-3 bg-default-50 dark:bg-default-100"
              >
                <span className="text-sm text-foreground">{session.date}</span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    session.status.toLowerCase() === "attend"
                      ? "success"
                      : session.status.toLowerCase() === "absent"
                        ? "danger"
                        : "default"
                  }
                >
                  {session.status}
                </Chip>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

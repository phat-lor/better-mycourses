"use client";

import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import type { AttendanceRecord, StoreCourse } from "./types";

interface AttendanceTabProps {
  course: StoreCourse;
}

const getAttendanceColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "attend":
    case "present":
      return "success";
    case "absent":
      return "danger";
    case "late":
      return "warning";
    case "excused":
      return "secondary";
    default:
      return "default";
  }
};

const getAttendanceStats = (attendance: AttendanceRecord[]) => {
  const total = attendance.length;
  const present = attendance.filter(
    (a) =>
      a.status.toLowerCase() === "attend" ||
      a.status.toLowerCase() === "present",
  ).length;
  const absent = attendance.filter(
    (a) => a.status.toLowerCase() === "absent",
  ).length;
  const late = attendance.filter(
    (a) => a.status.toLowerCase() === "late",
  ).length;
  const excused = attendance.filter(
    (a) => a.status.toLowerCase() === "excused",
  ).length;

  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent, late, excused, attendanceRate };
};

export default function AttendanceTab({ course }: AttendanceTabProps) {
  const attendance = course.attendance || [];

  if (attendance.length === 0) {
    return (
      <Card className="border border-divider">
        <CardBody className="text-center py-8">
          <p className="text-foreground/60">No attendance records available.</p>
        </CardBody>
      </Card>
    );
  }

  const stats = getAttendanceStats(attendance);

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <Card className="border border-divider">
        <CardHeader>
          <h3 className="text-lg font-semibold">Attendance Summary</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.attendanceRate}%
              </div>
              <div className="text-sm text-foreground/60">Attendance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {stats.present}
              </div>
              <div className="text-sm text-foreground/60">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">
                {stats.absent}
              </div>
              <div className="text-sm text-foreground/60">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {stats.late}
              </div>
              <div className="text-sm text-foreground/60">Late</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-default">
                {stats.total}
              </div>
              <div className="text-sm text-foreground/60">Total Sessions</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Attendance Records */}
      <Card className="border border-divider">
        <CardHeader>
          <h3 className="text-lg font-semibold">Attendance Records</h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-divider">
            {attendance.map((record, index) => (
              <div
                key={`${record.date}-${record.status}`}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{record.date}</p>
                  <p className="text-sm text-foreground/60">
                    Session {index + 1}
                  </p>
                </div>
                <Chip
                  size="sm"
                  color={
                    getAttendanceColor(record.status) as
                      | "success"
                      | "danger"
                      | "warning"
                      | "secondary"
                      | "default"
                  }
                  variant="flat"
                >
                  {record.status}
                </Chip>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

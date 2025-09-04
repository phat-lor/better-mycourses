"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Calendar, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { getAssignmentStatusChip, getQuizStatusChip } from "./status-chips";
import type { CourseStats, StoreCourse } from "./types";

interface CourseOverviewProps {
  course: StoreCourse;
}

export default function CourseOverview({ course }: CourseOverviewProps) {
  const courseStats: CourseStats = useMemo(() => {
    if (!course.content) return null;

    const activities = course.content.sections.flatMap((s) => s.activities);
    return {
      totalActivities: activities.length,
      quizzes: activities.filter((a) => a.type === "quiz").length,
      assignments: activities.filter((a) => a.type === "assign").length,
      resources: activities.filter((a) => a.type === "resource").length,
    };
  }, [course.content]);

  const recentActivities = useMemo(() => {
    if (!course.content) return [];

    const activities = course.content.sections
      .flatMap((s) => s.activities)
      .filter((a) => a.type === "quiz" || a.type === "assign")
      .filter((a) => a.url) // Only show activities with URLs (accessible)
      .slice(0, 5);

    return activities;
  }, [course.content]);

  return (
    <div className="space-y-6">
      {/* Course Summary */}
      {course.summary && (
        <Card className="border border-divider">
          <CardHeader>
            <h2 className="text-lg font-semibold">Course Description</h2>
          </CardHeader>
          <CardBody>
            <p className="text-foreground/80">{course.summary}</p>
          </CardBody>
        </Card>
      )}

      {/* Course Statistics */}
      {courseStats && (
        <Card className="border border-divider">
          <CardHeader>
            <h2 className="text-lg font-semibold">Course Statistics</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {courseStats.totalActivities}
                </div>
                <div className="text-sm text-foreground/60">
                  Total Activities
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {courseStats.quizzes}
                </div>
                <div className="text-sm text-foreground/60">Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {courseStats.assignments}
                </div>
                <div className="text-sm text-foreground/60">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-default">
                  {courseStats.resources}
                </div>
                <div className="text-sm text-foreground/60">Resources</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <Card className="border border-divider">
          <CardHeader>
            <h2 className="text-lg font-semibold">Recent Activities</h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-divider">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="min-w-0">
                    <p
                      className="font-medium text-foreground truncate"
                      title={activity.name}
                    >
                      {activity.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-foreground/60 capitalize">
                        {activity.type === "assign" ? "Assignment" : "Quiz"}
                      </span>
                      {activity.dueDate && (
                        <>
                          <span className="text-xs text-foreground/40">•</span>
                          <span className="text-xs text-foreground/60 flex items-center gap-1">
                            <Calendar size={12} />
                            Due {activity.dueDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.type === "quiz"
                      ? getQuizStatusChip(
                          activity.quizInfo,
                          activity.dueDate,
                          activity,
                        )
                      : getAssignmentStatusChip(
                          activity.assignmentInfo,
                          activity.dueDate,
                        )}
                    {activity.url && (
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => window.open(activity.url, "_blank")}
                      >
                        <ExternalLink size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Access */}
      <Card className="border border-divider">
        <CardHeader>
          <h2 className="text-lg font-semibold">Quick Access</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="flat"
              onPress={() => window.open(course.viewurl, "_blank")}
              startContent={<ExternalLink size={16} />}
            >
              Open in Moodle
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

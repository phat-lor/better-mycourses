"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Calendar } from "lucide-react";
import { useMemo } from "react";
import type { CourseActivity, CourseSection } from "@/utils/moodleParser";
import type { StoreCourse } from "./types";

export function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-foreground/60">{label}</p>
    </div>
  );
}

export function UpcomingList({ course }: { course: StoreCourse }) {
  const upcoming = useMemo<CourseActivity[]>(() => {
    if (!course.content) return [];
    const all = course.content.sections.flatMap(
      (s: CourseSection) => s.activities,
    );
    return all
      .filter((a) => a.dueDate && a.url) // Only show activities with due dates and URLs
      .sort((a, b) => {
        const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return at - bt;
      })
      .slice(0, 6);
  }, [course.content]);

  if (upcoming.length === 0) return null;

  return (
    <Card className="border border-divider">
      <CardHeader>
        <h2 className="text-xl font-semibold">Upcoming</h2>
      </CardHeader>
      <CardBody className="p-4">
        <div className="space-y-2">
          {upcoming.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg p-3 bg-default-50 dark:bg-default-100"
            >
              <div className="min-w-0">
                <p
                  className="font-medium text-foreground truncate"
                  title={a.name}
                >
                  {a.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Chip size="sm" variant="flat" className="capitalize">
                    {a.type}
                  </Chip>
                  {a.dueDate && (
                    <span className="text-xs text-foreground/60 flex items-center gap-1">
                      <Calendar size={12} />
                      {a.dueDate}
                    </span>
                  )}
                </div>
              </div>
              {a.url && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => window.open(a.url, "_blank")}
                >
                  Open
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

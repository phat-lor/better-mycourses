"use client";

import { Button, Card, CardBody, CardHeader, Chip, Input } from "@heroui/react";
import { Calendar, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CourseActivity } from "@/utils/moodleParser";
import { getQuizStatusChip } from "./status-chips";
import type { StoreCourse } from "./types";

interface QuizzesListProps {
  course: StoreCourse;
}

const statusOptions = [
  { key: "Open", label: "Open", color: "primary" },
  { key: "Completed", label: "Completed", color: "success" },
  { key: "In progress", label: "In progress", color: "warning" },
  { key: "Overdue", label: "Overdue", color: "danger" },
  { key: "Due soon", label: "Due soon", color: "warning" },
  { key: "Closes soon", label: "Closes soon", color: "danger" },
  { key: "Closes this week", label: "Closes this week", color: "warning" },
  { key: "Opens soon", label: "Opens soon", color: "primary" },
  { key: "Not yet opened", label: "Not yet opened", color: "default" },
  { key: "Closed", label: "Closed", color: "default" },
  { key: "Not started", label: "Not started", color: "default" },
  { key: "Unknown", label: "Unknown", color: "default" },
];

export default function QuizzesList({ course }: QuizzesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hiddenStatuses, setHiddenStatuses] = useState(
    new Set(["Unknown", "Not started", "Closed"]),
  );

  const allQuizzes = useMemo(() => {
    if (!course.content) return [] as CourseActivity[];
    return course.content.sections
      .flatMap((s) => s.activities)
      .filter((a) => a.type === "quiz" && a.url); // Only show quizzes with URLs
  }, [course.content]);

  const filteredQuizzes = useMemo(() => {
    let filtered = allQuizzes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((quiz) =>
        quiz.name.toLowerCase().includes(query),
      );
    }

    // Apply status filters
    if (hiddenStatuses.size > 0) {
      filtered = filtered.filter((quiz) => {
        const statusChip = getQuizStatusChip(quiz.quizInfo, quiz.dueDate, quiz);
        const statusText = statusChip.props.children;
        return !hiddenStatuses.has(statusText);
      });
    }

    // Sort by urgency: overdue -> due soon -> closes soon -> open -> others
    return filtered.sort((a, b) => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      const getDueTs = (activity: CourseActivity) => {
        return activity.quizInfo?.dueDate
          ? new Date(
              activity.quizInfo.dueDate.replace(/^Due:\s*/, ""),
            ).getTime()
          : activity.dueDate
            ? new Date(activity.dueDate.replace(/^Due:\s*/, "")).getTime()
            : undefined;
      };

      const getCloseTs = (activity: CourseActivity) => {
        return activity.quizInfo?.closeDate
          ? new Date(
              activity.quizInfo.closeDate.replace(/^(Closed?:|Closes:)\s*/, ""),
            ).getTime()
          : activity.closeDate
            ? new Date(
                activity.closeDate.replace(/^(Closed?:|Closes:)\s*/, ""),
              ).getTime()
            : undefined;
      };

      const aDue = getDueTs(a);
      const bDue = getDueTs(b);
      const aClose = getCloseTs(a);
      const bClose = getCloseTs(b);

      // Overdue items first
      const aOverdue = aDue && aDue < now;
      const bOverdue = bDue && bDue < now;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      // Due soon items next
      const aDueSoon = aDue && aDue - now < oneDay;
      const bDueSoon = bDue && bDue - now < oneDay;
      if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1;

      // Closes soon items next
      const aClosesSoon = aClose && aClose - now < oneDay;
      const bClosesSoon = bClose && bClose - now < oneDay;
      if (aClosesSoon !== bClosesSoon) return aClosesSoon ? -1 : 1;

      // Then by due date if both have one
      if (aDue && bDue) return aDue - bDue;
      if (aDue) return -1;
      if (bDue) return 1;

      // Finally by name
      return a.name.localeCompare(b.name);
    });
  }, [allQuizzes, searchQuery, hiddenStatuses]);

  const toggleStatusFilter = (status: string) => {
    const newHiddenStatuses = new Set(hiddenStatuses);
    if (newHiddenStatuses.has(status)) {
      newHiddenStatuses.delete(status);
    } else {
      newHiddenStatuses.add(status);
    }
    setHiddenStatuses(newHiddenStatuses);
  };

  return (
    <Card className="border border-divider">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold flex-1">Quizzes</h2>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <Input
            placeholder="Search quizzes..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search className="w-4 h-4 text-foreground/50" />}
            endContent={
              searchQuery && (
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )
            }
            size="sm"
            variant="bordered"
          />

          {showFilters && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground/80">
                Hide Status Types:
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Chip
                    key={option.key}
                    size="sm"
                    variant={hiddenStatuses.has(option.key) ? "solid" : "flat"}
                    color={
                      hiddenStatuses.has(option.key)
                        ? "default"
                        : (option.color as
                            | "primary"
                            | "success"
                            | "warning"
                            | "danger"
                            | "default")
                    }
                    className="cursor-pointer"
                    onClick={() => toggleStatusFilter(option.key)}
                  >
                    {hiddenStatuses.has(option.key) ? "🚫 " : ""}
                    {option.label}
                  </Chip>
                ))}
              </div>
              <div className="text-xs text-foreground/60">
                Click to toggle. Hidden by default: Unknown, Not started, Closed
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-divider">
          {filteredQuizzes.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p
                  className="font-medium text-foreground truncate"
                  title={a.name}
                >
                  {a.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {a.dueDate && (
                    <span className="text-xs text-foreground/60 flex items-center gap-1">
                      <Calendar size={12} />
                      Due {a.dueDate}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getQuizStatusChip(a.quizInfo, a.dueDate, a)}
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
            </div>
          ))}
          {filteredQuizzes.length === 0 && (
            <div className="p-6">
              <p className="text-sm text-foreground/60">
                {searchQuery.trim() || hiddenStatuses.size > 0
                  ? "No quizzes match your search or filter criteria."
                  : "No quizzes found."}
              </p>
              {(searchQuery.trim() || hiddenStatuses.size > 0) && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => {
                    setSearchQuery("");
                    setHiddenStatuses(
                      new Set(["Unknown", "Not started", "Closed"]),
                    );
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
} from "@heroui/react";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CourseActivity } from "@/utils/moodleParser";
import useUserStore from "@/utils/userStore";
import { getAssignmentStatusChip } from "../courses/status-chips";

// Generate unique key for assignments
const generateUniqueKey = (assignment: AssignmentWithCourse, index: number) => {
  return `assignment-${assignment.courseId}-${assignment.id}-${assignment.name.replace(/[^a-zA-Z0-9]/g, "")}-${index}`;
};

const assignmentStatusOptions = [
  { key: "Open", label: "Open", color: "primary" },
  { key: "Submitted", label: "Submitted", color: "success" },
  { key: "Draft", label: "Draft", color: "warning" },
  { key: "Overdue", label: "Overdue", color: "danger" },
  { key: "Due soon", label: "Due soon", color: "danger" },
  { key: "Due this week", label: "Due this week", color: "warning" },
  { key: "Closes soon", label: "Closes soon", color: "warning" },
  { key: "Opens soon", label: "Opens soon", color: "primary" },
  { key: "Not yet opened", label: "Not yet opened", color: "default" },
  { key: "Closed", label: "Closed", color: "default" },
  { key: "Not started", label: "Not started", color: "default" },
  { key: "Unknown", label: "Unknown", color: "default" },
];

interface AssignmentWithCourse extends CourseActivity {
  courseName: string;
  courseShortName: string;
  courseId: number;
}

export default function GlobalAssignmentsPage() {
  const { user } = useUserStore();
  const courses = user?.courses || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hiddenStatuses, setHiddenStatuses] = useState(
    new Set(["Unknown", "Not started", "Closed"]),
  );
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set(),
  );

  // Get all assignments from all courses
  const allAssignments = useMemo(() => {
    if (!courses.length) return [] as AssignmentWithCourse[];

    const assignments: AssignmentWithCourse[] = [];

    for (const course of courses) {
      if (!course.content) continue;

      const courseAssignments = course.content.sections
        .flatMap((s: any) => s.activities)
        .filter((a: any) => a.type === "assign" && a.url)
        .map((assignment: any) => ({
          ...assignment,
          courseName: course.fullname,
          courseShortName: course.shortname,
          courseId: course.id,
        }));

      assignments.push(...courseAssignments);
    }

    return assignments;
  }, [courses]);

  const filteredAssignments = useMemo(() => {
    let filtered = allAssignments;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (assignment) =>
          assignment.name.toLowerCase().includes(query) ||
          assignment.courseName.toLowerCase().includes(query) ||
          assignment.courseShortName.toLowerCase().includes(query),
      );
    }

    // Apply course filter
    if (selectedCourses.size > 0) {
      filtered = filtered.filter((assignment) =>
        selectedCourses.has(assignment.courseId),
      );
    }

    // Apply status filters
    if (hiddenStatuses.size > 0) {
      filtered = filtered.filter((assignment) => {
        const statusChip = getAssignmentStatusChip(
          assignment.assignmentInfo,
          assignment.dueDate,
        );
        const statusText = statusChip.props.children;
        return !hiddenStatuses.has(statusText);
      });
    }

    // Sort by urgency: overdue -> due soon -> open -> others
    return filtered.sort((a, b) => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      const getDueTs = (activity: AssignmentWithCourse) => {
        return activity.assignmentInfo?.dates?.dueDate
          ? new Date(
              activity.assignmentInfo.dates.dueDate.replace(/^Due:\s*/, ""),
            ).getTime()
          : activity.dueDate
            ? new Date(activity.dueDate.replace(/^Due:\s*/, "")).getTime()
            : undefined;
      };

      const aDue = getDueTs(a);
      const bDue = getDueTs(b);

      // Completed assignments go to bottom
      const aCompleted = a.assignmentInfo?.completionStatus === "complete";
      const bCompleted = b.assignmentInfo?.completionStatus === "complete";
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

      // Overdue items first (among non-completed)
      const aOverdue = aDue && aDue < now;
      const bOverdue = bDue && bDue < now;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      // Due soon items next
      const aDueSoon = aDue && aDue - now < oneDay;
      const bDueSoon = bDue && bDue - now < oneDay;
      if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1;

      // Then by due date if both have one
      if (aDue && bDue) return aDue - bDue;
      if (aDue) return -1;
      if (bDue) return 1;

      // Finally by name
      return a.name.localeCompare(b.name);
    });
  }, [allAssignments, searchQuery, hiddenStatuses, selectedCourses]);

  const toggleStatusFilter = (status: string) => {
    const newHiddenStatuses = new Set(hiddenStatuses);
    if (newHiddenStatuses.has(status)) {
      newHiddenStatuses.delete(status);
    } else {
      newHiddenStatuses.add(status);
    }
    setHiddenStatuses(newHiddenStatuses);
  };

  const toggleCourseFilter = (courseId: number) => {
    const newSelectedCourses = new Set(selectedCourses);
    if (newSelectedCourses.has(courseId)) {
      newSelectedCourses.delete(courseId);
    } else {
      newSelectedCourses.add(courseId);
    }
    setSelectedCourses(newSelectedCourses);
  };

  // Get assignment statistics
  const stats = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;
    let open = 0;

    filteredAssignments.forEach((assignment) => {
      if (assignment.assignmentInfo?.completionStatus === "complete") {
        completed++;
        return;
      }

      const dueDate = assignment.assignmentInfo?.dates?.dueDate
        ? new Date(
            assignment.assignmentInfo.dates.dueDate.replace(/^Due:\s*/, ""),
          ).getTime()
        : assignment.dueDate
          ? new Date(assignment.dueDate.replace(/^Due:\s*/, "")).getTime()
          : undefined;

      if (dueDate && dueDate < now) {
        overdue++;
      } else if (dueDate && dueDate - now < oneDay) {
        dueSoon++;
      } else {
        open++;
      }
    });

    return { overdue, dueSoon, completed, open };
  }, [filteredAssignments]);

  const coursesWithAssignments = useMemo(() => {
    if (!courses.length) return [];
    return courses.filter((course: any) =>
      course.content?.sections.some((section: any) =>
        section.activities.some(
          (activity: any) => activity.type === "assign" && activity.url,
        ),
      ),
    );
  }, [courses]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          All Assignments
        </h1>
        <p className="text-foreground/60">
          Track and manage assignments across all your courses
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border border-danger/20 bg-danger/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-danger">
                  {stats.overdue}
                </p>
                <p className="text-sm text-foreground/60">Overdue</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-warning/20 bg-warning/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-warning">
                  {stats.dueSoon}
                </p>
                <p className="text-sm text-foreground/60">Due Soon</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-success/20 bg-success/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-success">
                  {stats.completed}
                </p>
                <p className="text-sm text-foreground/60">Completed</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-primary/20 bg-primary/5">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-primary">
                  {stats.open}
                </p>
                <p className="text-sm text-foreground/60">Open</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border border-divider mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold flex-1">
                {filteredAssignments.length} Assignment
                {filteredAssignments.length !== 1 ? "s" : ""}
              </h2>
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
              placeholder="Search assignments or courses..."
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
              <div className="space-y-4">
                {/* Course Filter */}
                <div>
                  <div className="text-sm font-medium text-foreground/80 mb-2">
                    Filter by Course:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coursesWithAssignments.map((course: any) => (
                      <Chip
                        key={course.id}
                        size="sm"
                        variant={
                          selectedCourses.has(course.id) ? "solid" : "flat"
                        }
                        color={
                          selectedCourses.has(course.id) ? "primary" : "default"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleCourseFilter(course.id)}
                      >
                        {course.shortname}
                      </Chip>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Status Filter */}
                <div>
                  <div className="text-sm font-medium text-foreground/80 mb-2">
                    Hide Status Types:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assignmentStatusOptions.map((option) => (
                      <Chip
                        key={option.key}
                        size="sm"
                        variant={
                          hiddenStatuses.has(option.key) ? "solid" : "flat"
                        }
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
                  <div className="text-xs text-foreground/60 mt-2">
                    Click to toggle. Hidden by default: Unknown, Not started,
                    Closed
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Assignments List */}
      <Card className="border border-divider">
        <CardBody className="p-0">
          <div className="divide-y divide-divider">
            {filteredAssignments.map((assignment, index) => (
              <div
                key={generateUniqueKey(assignment, index)}
                className="flex items-center justify-between p-4 hover:bg-content2/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p
                      className="font-medium text-foreground truncate"
                      title={assignment.name}
                    >
                      {assignment.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-foreground/60 flex items-center gap-1">
                      <BookOpen size={12} />
                      {assignment.courseShortName}
                    </span>
                    {assignment.dueDate && (
                      <span className="text-foreground/60 flex items-center gap-1">
                        <Calendar size={12} />
                        Due {assignment.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {getAssignmentStatusChip(
                    assignment.assignmentInfo,
                    assignment.dueDate,
                  )}
                  {assignment.url && (
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => window.open(assignment.url, "_blank")}
                    >
                      Open
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredAssignments.length === 0 && (
              <div className="p-8 text-center">
                <div className="mb-4">
                  <BookOpen className="w-12 h-12 text-foreground/20 mx-auto" />
                </div>
                <p className="text-foreground/60 mb-2">
                  {searchQuery.trim() ||
                  hiddenStatuses.size > 0 ||
                  selectedCourses.size > 0
                    ? "No assignments match your search or filter criteria."
                    : "No assignments found across your courses."}
                </p>
                {(searchQuery.trim() ||
                  hiddenStatuses.size > 0 ||
                  selectedCourses.size > 0) && (
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setSearchQuery("");
                      setHiddenStatuses(
                        new Set(["Unknown", "Not started", "Closed"]),
                      );
                      setSelectedCourses(new Set());
                    }}
                    className="mt-2"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

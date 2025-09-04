"use client";

import { cn } from "@heroui/react";
import CourseCard from "./course-card";

interface Course {
  id: number;
  fullname: string;
  shortname: string;
  summary: string;
  courseimage: string;
  progress: number;
  hasprogress: boolean;
  isfavourite: boolean;
  hidden: boolean;
  coursecategory: string;
  viewurl: string;
  attendance?: Array<{ date: string; status: string }>;
}

interface CourseListProps {
  courses: Course[];
  className?: string;
}

export default function CourseList({ courses, className }: CourseListProps) {
  if (!courses || courses.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12",
          className,
        )}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-default-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-default-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="No courses icon"
            >
              <title>No courses available</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No courses found
          </h3>
          <p className="text-sm text-foreground/60 max-w-sm">
            You don't have any courses available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} variant="list" />
      ))}
    </div>
  );
}

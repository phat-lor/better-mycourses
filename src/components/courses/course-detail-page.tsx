"use client";

import { Spinner, Tab, Tabs } from "@heroui/react";
import { use } from "react";
import useUserStore from "@/utils/userStore";
import {
  ActivitiesList,
  AssignmentsList,
  AttendanceTab,
  type CourseDetailPageProps,
  CourseHeader,
  CourseOverview,
  CourseSyllabus,
  QuizzesList,
  type StoreCourse,
} from "./index";

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { user } = useUserStore();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.id, 10);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const course = user.courses.find((c: StoreCourse) => c.id === courseId);

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Course Not Found
          </h1>
          <p className="text-foreground/60">
            The course you're looking for doesn't exist or you don't have access
            to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <CourseHeader course={course} />

      <Tabs
        aria-label="Course sections"
        size="lg"
        variant="underlined"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
      >
        <Tab key="overview" title="Overview">
          <div className="py-6">
            <CourseOverview course={course} />
          </div>
        </Tab>

        <Tab key="activities" title="Activities">
          <div className="py-6">
            <ActivitiesList course={course} />
          </div>
        </Tab>

        <Tab key="quizzes" title="Quizzes">
          <div className="py-6">
            <QuizzesList course={course} />
          </div>
        </Tab>

        <Tab key="assignments" title="Assignments">
          <div className="py-6">
            <AssignmentsList course={course} />
          </div>
        </Tab>

        <Tab key="syllabus" title="Syllabus">
          <div className="py-6">
            <CourseSyllabus course={course} />
          </div>
        </Tab>

        <Tab key="attendance" title="Attendance">
          <div className="py-6">
            <AttendanceTab course={course} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

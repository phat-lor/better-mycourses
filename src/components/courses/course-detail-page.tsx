"use client";

import { ScrollShadow, Spinner, Tab, Tabs } from "@heroui/react";
import { use, useState } from "react";
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
  const [selectedTab, setSelectedTab] = useState("overview");

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

  const renderTabContent = () => {
    switch (selectedTab) {
      case "overview":
        return <CourseOverview course={course} />;
      case "activities":
        return <ActivitiesList course={course} />;
      case "quizzes":
        return <QuizzesList course={course} />;
      case "assignments":
        return <AssignmentsList course={course} />;
      case "syllabus":
        return <CourseSyllabus course={course} />;
      case "attendance":
        return <AttendanceTab course={course} />;
      default:
        return <CourseOverview course={course} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <CourseHeader course={course} />

      <div className="flex w-full justify-center mt-6 flex-shrink-0">
        <ScrollShadow
          hideScrollBar
          className="border-divider flex w-full max-w-[1024px] justify-between gap-8 border-b px-4 sm:px-8"
          orientation="horizontal"
        >
          <Tabs
            aria-label="Course sections"
            size="lg"
            variant="underlined"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            classNames={{
              tabList: "w-full relative rounded-none p-0 gap-4 lg:gap-6",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
          >
            <Tab key="overview" title="Overview" />
            <Tab key="activities" title="Activities" />
            <Tab key="quizzes" title="Quizzes" />
            <Tab key="assignments" title="Assignments" />
            <Tab key="syllabus" title="Syllabus" />
            <Tab key="attendance" title="Attendance" />
          </Tabs>
        </ScrollShadow>
      </div>

      <div className="py-6">{renderTabContent()}</div>
    </div>
  );
}

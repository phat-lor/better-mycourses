import type { CourseContent } from "@/utils/moodleParser";

export type AttendanceRecord = { date: string; status: string };

export type StoreCourse = {
  id: number;
  fullname: string;
  shortname: string;
  viewurl: string;
  courseimage: string;
  progress: number;
  hasprogress: boolean;
  isfavourite: boolean;
  coursecategory: string;
  summary?: string;
  attendance?: AttendanceRecord[];
  content?: CourseContent;
};

export type CourseStats = {
  totalActivities: number;
  quizzes: number;
  assignments: number;
  resources: number;
} | null;

export interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

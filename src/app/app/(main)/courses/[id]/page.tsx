import {
  CourseDetailPage,
  type CourseDetailPageProps,
} from "@/components/courses";

export default function CourseDetail({ params }: CourseDetailPageProps) {
  return <CourseDetailPage params={params} />;
}

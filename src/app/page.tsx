import type { Metadata } from "next";
import { Landing } from "@/components/shared";

export const metadata: Metadata = {
  title: "Better MyCourses - Modern Moodle Interface",
  description:
    "Transform your Moodle experience with a clean, modern interface. Better navigation, enhanced usability, and all the features you wish MyCourses had from the start.",
  openGraph: {
    title: "Better MyCourses - Modern Moodle Interface",
    description:
      "Transform your Moodle experience with a clean, modern interface. Better navigation, enhanced usability, and all the features you wish MyCourses had from the start.",
  },
  twitter: {
    title: "Better MyCourses - Modern Moodle Interface",
    description:
      "Transform your Moodle experience with a clean, modern interface. Better navigation, enhanced usability, and all the features you wish MyCourses had from the start.",
  },
};

export default function Home() {
  return <Landing />;
}

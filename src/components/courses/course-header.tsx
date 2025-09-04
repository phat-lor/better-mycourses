"use client";

import { Button, Chip } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { StoreCourse } from "./types";

interface CourseHeaderProps {
  course: StoreCourse;
}

export default function CourseHeader({ course }: CourseHeaderProps) {
  const router = useRouter();

  const aiLevel = course.content?.aiLevel;

  return (
    <div className="flex items-center gap-4 mb-6">
      <Button
        isIconOnly
        variant="light"
        onPress={() => router.back()}
        className="shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
        <Image
          src={course.courseimage}
          alt={course.fullname}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-foreground truncate">
          {course.fullname}
        </h1>
        <p className="text-sm text-foreground/70 truncate">
          {course.shortname} • {course.coursecategory}
        </p>
      </div>

      {aiLevel && aiLevel.level > 1 && (
        <Chip size="sm" color="primary" variant="flat">
          AI allowed
        </Chip>
      )}
    </div>
  );
}

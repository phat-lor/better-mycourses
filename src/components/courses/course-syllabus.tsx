"use client";

import { Button, Card, CardBody, Chip } from "@heroui/react";
import { ExternalLink } from "lucide-react";
import type { CourseSection, SyllabusRow } from "@/utils/moodleParser";
import type { StoreCourse } from "./types";

interface CourseSyllabusProps {
  course: StoreCourse;
}

export function CourseSyllabus({ course }: CourseSyllabusProps) {
  const section = course.content?.sections.find(
    (s: CourseSection) => s.syllabusInfo && s.syllabusInfo.type !== "none",
  );
  const info = section?.syllabusInfo;
  if (!info) return null;

  if (info.type === "pdf") {
    return (
      <Card className="border border-divider">
        <CardBody className="p-6">
          <div className="flex items-center justify-center">
            <Button
              size="sm"
              endContent={<ExternalLink size={16} />}
              onPress={() => window.open(info.pdfUrl, "_blank")}
            >
              View syllabus PDF{info.pdfName ? `: ${info.pdfName}` : ""}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (info.type === "table" && info.data) {
    return (
      <Card className="border border-divider">
        <CardBody className="p-0">
          <div className="divide-y divide-divider">
            {info.data.map((row: SyllabusRow, idx: number) => (
              <div key={`syllabus-${row.lectureNumber || idx}`} className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  {row.lectureNumber && (
                    <Chip size="sm" variant="flat">
                      {row.type === "exam"
                        ? "EXAM"
                        : `Lecture ${row.lectureNumber}`}
                    </Chip>
                  )}
                </div>
                <div className="space-y-2">
                  {row.topics.map((t) => (
                    <div key={t.title}>
                      <p className="font-medium text-foreground">{t.title}</p>
                      {t.subtopics.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-foreground/70 mt-1 space-y-1">
                          {t.subtopics.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return null;
}

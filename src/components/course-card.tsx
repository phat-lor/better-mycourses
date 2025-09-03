"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { Eye, EyeOff, Heart, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import useUserStore from "@/utils/userStore";

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

interface CourseCardProps {
  course: Course;
  variant?: "grid" | "list";
}

export default function CourseCard({
  course,
  variant = "grid",
}: CourseCardProps) {
  const { toggleCourseFavorite, toggleCourseHidden } = useUserStore();
  const [imageError, setImageError] = useState(false);

  const handleFavoriteToggle = () => {
    toggleCourseFavorite(course.id);
  };

  const handleHiddenToggle = () => {
    toggleCourseHidden(course.id);
  };

  const attendancePercentage = course.attendance
    ? Math.round(
        (course.attendance.filter(
          (session) => session.status.toLowerCase() === "attend",
        ).length /
          course.attendance.length) *
          100,
      )
    : 0;

  if (variant === "list") {
    return (
      <Card className="w-full bg-card hover:bg-card/80 transition-colors border border-transparent hover:border-divider">
        <CardBody className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {!imageError && course.courseimage ? (
                <Image
                  src={course.courseimage}
                  alt={course.fullname}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-default-200 dark:bg-default-100 flex items-center justify-center">
                  <Icon
                    icon="solar:book-2-linear"
                    width={24}
                    className="text-default-500"
                  />
                </div>
              )}
              {course.isfavourite && (
                <div className="absolute -top-1 -right-1">
                  <Icon
                    icon="solar:heart-bold"
                    width={16}
                    className="text-danger-500"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {course.fullname}
                  </h3>
                  <p className="text-sm text-foreground/60 mb-2">
                    {course.shortname}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {course.coursecategory && (
                    <Chip size="sm" variant="flat" className="text-xs">
                      {course.coursecategory}
                    </Chip>
                  )}
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="view"
                        href={course.viewurl}
                        target="_blank"
                      >
                        View Course
                      </DropdownItem>
                      <DropdownItem
                        key="favorite"
                        onClick={handleFavoriteToggle}
                        startContent={
                          <Heart
                            size={16}
                            className={
                              course.isfavourite ? "text-danger-500" : ""
                            }
                            fill={course.isfavourite ? "currentColor" : "none"}
                          />
                        }
                      >
                        {course.isfavourite
                          ? "Remove from Favorites"
                          : "Add to Favorites"}
                      </DropdownItem>
                      <DropdownItem
                        key="visibility"
                        onClick={handleHiddenToggle}
                        startContent={
                          course.hidden ? (
                            <Eye size={16} />
                          ) : (
                            <EyeOff size={16} />
                          )
                        }
                      >
                        {course.hidden ? "Show Course" : "Hide Course"}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {course.attendance && course.attendance.length > 0 && (
                  <Tooltip
                    content={
                      <div className="px-2 py-2 max-w-xs">
                        <div className="text-small font-bold mb-2">
                          {course.shortname} Attendance
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <div className="text-tiny font-medium">
                              {course.fullname}
                            </div>
                            <div className="text-tiny text-foreground/60">
                              {
                                course.attendance.filter(
                                  (session) =>
                                    session.status.toLowerCase() === "attend",
                                ).length
                              }
                              /{course.attendance.length} (
                              {attendancePercentage}%)
                            </div>
                          </div>
                          <Progress
                            value={attendancePercentage}
                            color={
                              attendancePercentage >= 80
                                ? "success"
                                : attendancePercentage >= 60
                                  ? "warning"
                                  : "danger"
                            }
                            size="sm"
                            className="w-full"
                          />
                          <div className="flex flex-wrap gap-1 mt-2">
                            {course.attendance.map((session, idx) => (
                              <div
                                key={`${session.date}-${idx}`}
                                className={cn(
                                  "w-3 h-3 rounded-full text-xs flex items-center justify-center",
                                  {
                                    "bg-success-500":
                                      session.status.toLowerCase() === "attend",
                                    "bg-danger-500":
                                      session.status.toLowerCase() === "absent",
                                    "bg-default-300": ![
                                      "attend",
                                      "absent",
                                    ].includes(session.status.toLowerCase()),
                                  },
                                )}
                                title={`${session.date}: ${session.status}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    }
                    placement="bottom"
                  >
                    <div className="flex-1 max-w-xs cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground/60">
                          Attendance
                        </span>
                        <span className="text-xs text-foreground/60">
                          {attendancePercentage}%
                        </span>
                      </div>
                      <Progress
                        value={attendancePercentage}
                        size="sm"
                        color={
                          attendancePercentage >= 80
                            ? "success"
                            : attendancePercentage >= 60
                              ? "warning"
                              : "danger"
                        }
                      />
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card hover:bg-card/80 transition-colors border border-transparent hover:border-divider">
      <CardHeader className="p-0 relative">
        <div className="relative w-full aspect-video">
          {!imageError && course.courseimage ? (
            <Image
              src={course.courseimage}
              alt={course.fullname}
              fill
              className="object-cover rounded-t-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-default-200 dark:bg-default-100 flex items-center justify-center rounded-t-lg">
              <Icon
                icon="solar:book-2-linear"
                width={32}
                className="text-default-500"
              />
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-2">
            {course.isfavourite && (
              <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full p-1">
                <Icon
                  icon="solar:heart-bold"
                  width={16}
                  className="text-danger-500"
                />
              </div>
            )}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  className="bg-white/90 dark:bg-black/90 backdrop-blur-sm"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="view" href={course.viewurl} target="_blank">
                  View Course
                </DropdownItem>
                <DropdownItem
                  key="favorite"
                  onClick={handleFavoriteToggle}
                  startContent={
                    <Heart
                      size={16}
                      className={course.isfavourite ? "text-danger-500" : ""}
                      fill={course.isfavourite ? "currentColor" : "none"}
                    />
                  }
                >
                  {course.isfavourite
                    ? "Remove from Favorites"
                    : "Add to Favorites"}
                </DropdownItem>
                <DropdownItem
                  key="visibility"
                  onClick={handleHiddenToggle}
                  startContent={
                    course.hidden ? <Eye size={16} /> : <EyeOff size={16} />
                  }
                >
                  {course.hidden ? "Show Course" : "Hide Course"}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-4">
        <div className="mb-3">
          <Tooltip content={course.fullname}>
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 leading-tight">
              {course.fullname}
            </h3>
          </Tooltip>
          <p className="text-sm text-foreground/60 mt-1">{course.shortname}</p>
        </div>

        {course.coursecategory && (
          <Chip size="sm" variant="flat" className="mb-3 text-xs">
            {course.coursecategory}
          </Chip>
        )}

        <div className="space-y-3">
          {course.attendance && course.attendance.length > 0 && (
            <Tooltip
              content={
                <div className="px-2 py-2 max-w-xs">
                  <div className="text-small font-bold mb-2">
                    {course.shortname} Attendance
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="text-tiny font-medium">
                        {course.fullname}
                      </div>
                      <div className="text-tiny text-foreground/60">
                        {
                          course.attendance.filter(
                            (session) =>
                              session.status.toLowerCase() === "attend",
                          ).length
                        }
                        /{course.attendance.length} ({attendancePercentage}%)
                      </div>
                    </div>
                    <Progress
                      value={attendancePercentage}
                      color={
                        attendancePercentage >= 80
                          ? "success"
                          : attendancePercentage >= 60
                            ? "warning"
                            : "danger"
                      }
                      size="sm"
                      className="w-full"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {course.attendance.map((session, idx) => (
                        <div
                          key={`${session.date}-${idx}`}
                          className={cn(
                            "w-3 h-3 rounded-full text-xs flex items-center justify-center",
                            {
                              "bg-success-500":
                                session.status.toLowerCase() === "attend",
                              "bg-danger-500":
                                session.status.toLowerCase() === "absent",
                              "bg-default-300": !["attend", "absent"].includes(
                                session.status.toLowerCase(),
                              ),
                            },
                          )}
                          title={`${session.date}: ${session.status}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              }
              placement="bottom"
            >
              <div className="cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground/60">Attendance</span>
                  <span className="text-xs text-foreground/60">
                    {attendancePercentage}%
                  </span>
                </div>
                <Progress
                  value={attendancePercentage}
                  size="sm"
                  color={
                    attendancePercentage >= 80
                      ? "success"
                      : attendancePercentage >= 60
                        ? "warning"
                        : "danger"
                  }
                />
              </div>
            </Tooltip>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

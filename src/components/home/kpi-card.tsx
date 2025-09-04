"use client";

import {
  Button,
  Card,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface KPIData {
  title: string;
  value: string;
  percentage: number;
  status: "good" | "warn" | "danger";
  iconName: string;
  details?: string[];
  courseBreakdown?: Array<{
    courseName: string;
    shortname: string;
    attended: number;
    total: number;
    percentage: number;
    sessions: Array<{ date: string; status: string }>;
  }>;
}

interface KPICardProps {
  data: KPIData;
}

export default function KPICard({ data }: KPICardProps) {
  const {
    title,
    value,
    percentage,
    status,
    iconName,
    details,
    courseBreakdown,
  } = data;

  return (
    <Card className="border border-transparent p-4 dark:px-0 bg-card hover:bg-card/50 transition-colors">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border p-0.5",
          {
            "border-success-200 bg-success-50 dark:border-success-100":
              status === "good",
            "border-warning-200 bg-warning-50 dark:border-warning-100":
              status === "warn",
            "border-danger-200 bg-danger-50 dark:border-danger-100":
              status === "danger",
          },
        )}
      >
        {status === "good" ? (
          <Icon className="text-success-500" icon={iconName} width={20} />
        ) : status === "warn" ? (
          <Icon className="text-warning-500" icon={iconName} width={20} />
        ) : (
          <Icon className="text-danger-500" icon={iconName} width={20} />
        )}
      </div>

      <div className="pt-1">
        <dt className="text-foreground/60 my-2 text-sm font-medium">{title}</dt>
        <dd className="text-foreground text-2xl font-semibold">{value}</dd>
        {percentage > 0 && (
          <p className="text-xs text-foreground/50 mt-1">
            {percentage}% completion
          </p>
        )}
      </div>

      <Progress
        aria-label="progress"
        className="mt-3"
        color={
          status === "good"
            ? "success"
            : status === "warn"
              ? "warning"
              : "danger"
        }
        value={percentage}
        size="sm"
      />

      {/* Info/Details trigger */}
      {title === "Overall Attendance" &&
      courseBreakdown &&
      courseBreakdown.length > 0 ? (
        <Popover placement="right" showArrow>
          <PopoverTrigger>
            <Button
              isIconOnly
              className="absolute top-3 right-3 w-auto rounded-full"
              size="sm"
              variant="light"
            >
              <Icon height={16} icon="solar:info-circle-linear" width={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="px-2 py-2">
              <div className="text-small font-bold mb-2">{title} Details</div>
              <div className="max-h-48 overflow-y-auto space-y-3">
                {courseBreakdown.map((course) => (
                  <div key={course.shortname} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="text-tiny font-medium">
                        {course.shortname}
                      </div>
                      <div className="text-tiny text-foreground/60">
                        {course.attended}/{course.total} ({course.percentage}%)
                      </div>
                    </div>
                    <Progress
                      value={course.percentage}
                      color={
                        course.percentage >= 80
                          ? "success"
                          : course.percentage >= 60
                            ? "warning"
                            : "danger"
                      }
                      size="sm"
                      className="w-full"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {course.sessions.map((session, idx) => (
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
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : details && details.length > 0 ? (
        <Tooltip
          content={
            <div className="px-1 py-2">
              <div className="text-small font-bold mb-1">{title} Breakdown</div>
              <div className="text-tiny space-y-1">
                {details.map((detail) => (
                  <div key={detail}>{detail}</div>
                ))}
              </div>
            </div>
          }
          placement="bottom"
        >
          <Button
            isIconOnly
            className="absolute top-3 right-3 w-auto rounded-full"
            size="sm"
            variant="light"
          >
            <Icon height={16} icon="solar:info-circle-linear" width={16} />
          </Button>
        </Tooltip>
      ) : null}

      <Dropdown
        classNames={{
          content: "min-w-[120px]",
        }}
        placement="bottom-end"
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            className="absolute top-3 right-9 w-auto rounded-full"
            size="sm"
            variant="light"
          >
            <Icon height={16} icon="solar:menu-dots-bold" width={16} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          itemClasses={{
            title: "text-tiny",
          }}
          variant="flat"
        >
          <DropdownItem key="view-details">View Details</DropdownItem>
          <DropdownItem key="export-data">Export Data</DropdownItem>
          <DropdownItem key="set-alert">Set Alert</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </Card>
  );
}

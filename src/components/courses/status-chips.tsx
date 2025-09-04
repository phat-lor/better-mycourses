"use client";

import { Chip } from "@heroui/react";
import type {
  AssignmentInfo,
  CourseActivity,
  QuizInfo,
} from "@/utils/moodleParser";

export const getQuizStatusChip = (
  quiz?: QuizInfo,
  dueDate?: string,
  activity?: CourseActivity,
) => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  // Always prioritize activity-level dates, then quiz-level dates
  const activityOpenTs = activity?.openDate
    ? new Date(activity.openDate.replace(/^(Opened?:|Opens:)\s*/, "")).getTime()
    : undefined;
  const activityCloseTs = activity?.closeDate
    ? new Date(
        activity.closeDate.replace(/^(Closed?:|Closes:)\s*/, ""),
      ).getTime()
    : undefined;

  const openTs = quiz?.openDate
    ? new Date(quiz.openDate.replace(/^(Opened?:|Opens:)\s*/, "")).getTime()
    : activityOpenTs;
  const closeTs = quiz?.closeDate
    ? new Date(quiz.closeDate.replace(/^(Closed?:|Closes:)\s*/, "")).getTime()
    : activityCloseTs;
  const dueTs = quiz?.dueDate
    ? new Date(quiz.dueDate.replace(/^Due:\s*/, "")).getTime()
    : dueDate
      ? new Date(dueDate.replace(/^Due:\s*/, "")).getTime()
      : undefined;

  // Check for in progress attempt first
  if (quiz?.currentAttempt?.status === "in_progress") {
    return (
      <Chip size="sm" color="warning" variant="flat">
        In progress
      </Chip>
    );
  }

  // Check completion status
  if (quiz?.status === "completed") {
    return (
      <Chip size="sm" color="success" variant="flat">
        Completed
      </Chip>
    );
  }

  // Check if not yet opened (prioritize actual dates over status)
  if (openTs && now < openTs) {
    if (openTs - now < oneDay) {
      return (
        <Chip size="sm" color="primary" variant="flat">
          Opens soon
        </Chip>
      );
    }
    return (
      <Chip size="sm" variant="flat">
        Not yet opened
      </Chip>
    );
  }

  // Check if overdue (higher priority than closed status)
  if (dueTs && now > dueTs) {
    return (
      <Chip size="sm" color="danger" variant="flat">
        Overdue
      </Chip>
    );
  }

  // Check for closing soon (higher priority than closed status)
  if (closeTs && closeTs - now < oneDay && now < closeTs) {
    return (
      <Chip size="sm" color="danger" variant="flat">
        Closes soon
      </Chip>
    );
  }

  // Check for due soon
  if (dueTs && dueTs - now < oneDay) {
    return (
      <Chip size="sm" color="warning" variant="flat">
        Due soon
      </Chip>
    );
  }

  // Check for closing this week
  if (closeTs && closeTs - now < oneWeek && now < closeTs) {
    return (
      <Chip size="sm" color="warning" variant="flat">
        Closes this week
      </Chip>
    );
  }

  // Check if currently open (between open and close dates)
  if (openTs && closeTs && now >= openTs && now <= closeTs) {
    return (
      <Chip size="sm" color="primary" variant="flat">
        Open
      </Chip>
    );
  }

  // If we have close date and we're past it, it's closed
  if (closeTs && now > closeTs) {
    return (
      <Chip size="sm" color="default" variant="flat">
        Closed
      </Chip>
    );
  }

  // Default to open if quiz is available and we're past open date
  if (quiz?.status === "available" && (!openTs || now >= openTs)) {
    return (
      <Chip size="sm" color="primary" variant="flat">
        Open
      </Chip>
    );
  }

  // Handle quiz status fallbacks
  if (quiz) {
    switch (quiz.status) {
      case "available":
        return (
          <Chip size="sm" color="primary" variant="flat">
            Open
          </Chip>
        );
      case "closed":
        return (
          <Chip size="sm" color="default" variant="flat">
            Closed
          </Chip>
        );
      case "not_started":
      default:
        return (
          <Chip size="sm" variant="flat">
            Not started
          </Chip>
        );
    }
  }

  return (
    <Chip size="sm" variant="flat">
      Unknown
    </Chip>
  );
};

export const getAssignmentStatusChip = (
  info?: AssignmentInfo,
  dueDate?: string,
) => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  if (!info) {
    const dueTs = dueDate
      ? new Date(dueDate.replace(/^Due:\s*/, "")).getTime()
      : undefined;
    if (dueTs && now > dueTs) {
      return (
        <Chip size="sm" color="danger" variant="flat">
          Overdue
        </Chip>
      );
    }
    if (dueTs && dueTs - now < oneDay) {
      return (
        <Chip size="sm" color="warning" variant="flat">
          Due soon
        </Chip>
      );
    }
    return (
      <Chip size="sm" variant="flat">
        Unknown
      </Chip>
    );
  }

  // Parse dates from assignment info (strip labels)
  const openTs = info.dates?.openDate
    ? new Date(
        info.dates.openDate.replace(/^(Opened?:|Opens:)\s*/, ""),
      ).getTime()
    : undefined;
  const closeTs = info.dates?.cutoffDate
    ? new Date(
        info.dates.cutoffDate.replace(/^(Closed?:|Closes:)\s*/, ""),
      ).getTime()
    : undefined;
  const dueTs = info.dates?.dueDate
    ? new Date(info.dates.dueDate.replace(/^Due:\s*/, "")).getTime()
    : dueDate
      ? new Date(dueDate.replace(/^Due:\s*/, "")).getTime()
      : undefined;

  // Priority: submitted -> closed -> overdue -> due soon -> open -> opening soon -> draft -> not started
  if (info.completionStatus === "complete") {
    return (
      <Chip size="sm" color="success" variant="flat">
        Submitted
      </Chip>
    );
  }

  if (info.activityStatus === "closed" || (closeTs && now > closeTs)) {
    return (
      <Chip size="sm" color="default" variant="flat">
        Closed
      </Chip>
    );
  }

  if (dueTs && now > dueTs) {
    return (
      <Chip size="sm" color="danger" variant="flat">
        Overdue
      </Chip>
    );
  }

  // Check if not yet opened
  if (openTs && now < openTs) {
    if (openTs - now < oneDay) {
      return (
        <Chip size="sm" color="primary" variant="flat">
          Opens soon
        </Chip>
      );
    }
    return (
      <Chip size="sm" variant="flat">
        Not yet opened
      </Chip>
    );
  }

  // Check for due soon
  if (dueTs && dueTs - now < oneDay) {
    return (
      <Chip size="sm" color="danger" variant="flat">
        Due soon
      </Chip>
    );
  }

  // Check for due this week
  if (dueTs && dueTs - now < oneWeek) {
    return (
      <Chip size="sm" color="warning" variant="flat">
        Due this week
      </Chip>
    );
  }

  // Check for closing soon
  if (closeTs && closeTs - now < oneDay) {
    return (
      <Chip size="sm" color="warning" variant="flat">
        Closes soon
      </Chip>
    );
  }

  // If opened and can submit
  if (info.canSubmit) {
    return (
      <Chip size="sm" color="primary" variant="flat">
        Open
      </Chip>
    );
  }

  if (info.submission?.submissionStatus === "draft") {
    return (
      <Chip size="sm" color="warning" variant="flat">
        Draft
      </Chip>
    );
  }

  return (
    <Chip size="sm" variant="flat">
      Not started
    </Chip>
  );
};

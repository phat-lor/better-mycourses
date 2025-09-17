import * as cheerio from "cheerio";
import type { Element } from "domhandler";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export interface AbsentRecord {
  date: string;
  status: string;
}

export interface QuizAttempt {
  attemptNumber: number;
  status: "finished" | "in_progress" | "never_started" | "abandoned";
  startedOn?: string;
  completedOn?: string;
  timeTaken?: string;
  grade?: string;
  marks?: string;
  scorePercentage?: string;
  rawScore?: string;
  maxScore?: string;
  reviewUrl?: string;
}

export interface QuizInfo {
  quizId: string;
  quizName: string;
  courseId: string;
  description?: string;
  attemptsAllowed: number;
  gradingMethod?: string;
  timeLimit?: string;
  openDate?: string;
  closeDate?: string;
  dueDate?: string;
  status: "available" | "closed" | "not_started" | "completed";
  attempts: QuizAttempt[];
  currentAttempt?: QuizAttempt;
  canAttempt: boolean;
  finalGrade?: string;
  totalMarks?: string;
}

export interface SubmissionFile {
  name: string;
  url?: string;
  size?: string;
  type?: string;
  uploadDate?: string;
}

export interface AssignmentComment {
  author?: string;
  date?: string;
  content: string;
}

export interface AssignmentSettings {
  submissionTypes?: string[];
  maxFileSize?: string;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  requireClickSubmit?: boolean;
  requireAcceptance?: boolean;
  groupSubmission?: boolean;
  preventLateSubmissions?: boolean;
  notifyGraders?: boolean;
}

export interface AssignmentDates {
  openDate?: string;
  dueDate?: string;
  cutoffDate?: string;
  reminderDate?: string;
  allowSubmissionsFrom?: string;
  timeRemaining?: string;
  isOverdue?: boolean;
  overdueBy?: string;
}

export interface AssignmentGrading {
  gradingStatus: "graded" | "not_graded" | "needs_grading";
  grade?: string;
  maxGrade?: string;
  gradePercentage?: string;
  gradedBy?: string;
  gradedDate?: string;
  gradingScale?: string;
  passingGrade?: string;
  feedback?: string;
  rubricGrade?: string;
}

export interface AssignmentSubmission {
  submissionStatus:
    | "submitted"
    | "draft"
    | "new"
    | "reopened"
    | "no_submission";
  attemptNumber?: number;
  submissionDate?: string;
  lastModified?: string;
  submissionMethod?: string;
  files?: SubmissionFile[];
  textSubmission?: string;
  onlineText?: string;
  comments?: AssignmentComment[];
  wordCount?: number;
  plagiarismStatus?: string;
  turnitinScore?: string;
}

export interface AssignmentInfo {
  assignmentId: string;
  assignmentName: string;
  courseId: string;
  description?: string;
  instructions?: string;

  // Date information
  dates: AssignmentDates;

  // Submission details
  submission: AssignmentSubmission;

  // Grading information
  grading: AssignmentGrading;

  // Assignment settings
  settings: AssignmentSettings;

  // Additional metadata
  attemptsAllowed?: number;
  attemptsUsed?: number;
  canSubmit?: boolean;
  canEdit?: boolean;
  hasExtension?: boolean;
  extensionDueDate?: string;

  // Activity status
  activityStatus?: "open" | "closed" | "not_yet_open";
  completionStatus?: "complete" | "incomplete" | "not_attempted";
}

export interface CourseActivity {
  id: string;
  name: string;
  type: string; // 'forum', 'resource', 'assign', 'quiz', etc.
  moduleId: string;
  url: string;
  description?: string;
  dueDate?: string;
  openDate?: string;
  closeDate?: string;
  availability?: string;
  icon?: string;
  // Extended activity data
  quizInfo?: QuizInfo;
  assignmentInfo?: AssignmentInfo;
}

export interface CourseSection {
  id: string;
  number: number;
  name: string;
  summary?: string;
  activities: CourseActivity[];
  collapsed?: boolean;
  syllabusData?: SyllabusRow[] | null;
  syllabusInfo?: SyllabusInfo;
}

export interface SyllabusRow {
  lectureNumber: string | null;
  type: "lecture" | "exam" | "content";
  topics: {
    title: string;
    subtopics: string[];
  }[];
  quizzes: string[];
  materials: {
    name: string;
    url: string;
    type: string;
  }[];
  labExercises: {
    name: string;
    url: string;
    type: string;
  }[];
  rawDescription: string;
  rawMaterials: string;
  rawLabExercises: string;
  isSpecialRow: boolean;
}

export interface SyllabusInfo {
  type: "table" | "pdf" | "none";
  data?: SyllabusRow[];
  pdfUrl?: string;
  pdfName?: string;
}

export interface CourseContent {
  courseId: string;
  courseName: string;
  sections: CourseSection[];
  attendanceInfo?: {
    current: number;
    total: number;
    percentage: number;
  };
  aiLevel?: {
    level: number;
    description: string;
    color: string;
  };
}

/**
 * Extracts sesskey from Moodle HTML content
 */
export function extractSesskey(htmlContent: string): string | null {
  const $ = cheerio.load(htmlContent);

  for (const script of $("script")) {
    const scriptContent = $(script).html();
    if (scriptContent?.includes("M.cfg")) {
      const sesskeyMatch = scriptContent.match(/"sesskey":"([^"]+)"/);
      if (sesskeyMatch) {
        return sesskeyMatch[1];
      }
    }
  }

  return null;
}

/**
 * Extracts AI level information from course page
 */
export function extractAILevel(
  htmlContent: string,
): { level: number; description: string; color: string } | null {
  const $ = cheerio.load(htmlContent);

  const aiButton = $("button[id='aiToggleBtn']");
  if (!aiButton.length) return null;

  const buttonText = aiButton.text().trim();
  const levelMatch = buttonText.match(/AI Level (\d+)/);

  if (!levelMatch) return null;

  const level = parseInt(levelMatch[1], 10);
  const description = $("#aiCard .card-title").text().trim();

  // Determine color based on level
  const colorMap: Record<number, string> = {
    1: "#ff6562",
    2: "#33d1be",
    3: "#ffab40",
    4: "#1f80e8",
    5: "#bd59bd",
  };

  return {
    level,
    description,
    color: colorMap[level] || "#000000",
  };
}

/**
 * Extracts user profile information from Moodle profile page HTML
 */
export function extractUserProfile(htmlContent: string): UserProfile | null {
  const $ = cheerio.load(htmlContent);

  // Extract and validate full name
  const fullName = $("h1.h2.mb-0").first().text().trim();
  if (!fullName) return null;

  const nameParts = fullName.split(" ");
  if (nameParts.length < 2) return null;

  // Extract and decode email address
  const emailElement = $('dt:contains("Email address")')
    .next("dd")
    .find("a")
    .first();
  if (!emailElement.length) return null;

  const emailHref = emailElement.attr("href") || "";
  const emailText = emailElement.html() || "";

  // Decode email from href (mailto:) or fallback to text content
  const decodedHref = decodeText(emailHref);
  const emailMatch = decodedHref.match(/mailto:(.+)/);
  const email = emailMatch ? decodeText(emailMatch[1]) : decodeText(emailText);

  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    email,
  };
}

/**
 * Decodes HTML entities and URL encoding in a string
 */
function decodeText(text: string): string {
  if (!text) return "";

  // Decode HTML entities using cheerio
  const $temp = cheerio.load("<div></div>");
  $temp("div").html(text);
  const htmlDecoded = $temp("div").text();

  // Decode URL encoding
  try {
    return decodeURIComponent(htmlDecoded);
  } catch {
    return htmlDecoded;
  }
}

/**
 * Public function to decode HTML entities - exported for use in API routes
 */
export function decodeHtmlEntities(text: string): string {
  return decodeText(text);
}

/**
 * Extracts absent records from Moodle attendance table HTML
 */
export function extractAbsentRecords(htmlContent: string): AbsentRecord[] {
  const $ = cheerio.load(htmlContent);
  const absentRecords: AbsentRecord[] = [];

  // Find the attendance table
  const table = $("table.table.table-striped");
  if (!table.length) return absentRecords;

  // Process each row in the table body
  table.find("tbody tr").each((_, row) => {
    const $row = $(row);
    const cells = $row.find("td");

    if (cells.length >= 3) {
      const date = $(cells[1]).text().trim();
      const statusElement = $(cells[2]).find("span");
      const status = statusElement.text().trim();

      if (date && status) {
        absentRecords.push({
          date,
          status,
        });
      }
    }
  });

  return absentRecords;
}

/**
 * Parses syllabus information from various sources
 */
function parseSyllabusInfo(html: string): SyllabusInfo {
  const $ = cheerio.load(html);

  // Strategy 1: Look for Course Syllabus section with table
  const syllabusSection = $('li[data-sectionname="Course Syllabus"]');
  if (syllabusSection.length) {
    // Check for HTML table first
    let table = syllabusSection.find("table").first();
    if (!table.length) {
      table = syllabusSection.find(".summarytext table").first();
    }
    if (!table.length) {
      table = syllabusSection.find(".no-overflow table").first();
    }

    if (table.length) {
      const rows = parseSyllabusTableRows(table, $);
      if (rows.length > 0) {
        return { type: "table", data: rows };
      }
    }

    // If no table, look for PDF syllabus link
    const syllabusLinks = syllabusSection.find("a");
    for (let i = 0; i < syllabusLinks.length; i++) {
      const link = syllabusLinks.eq(i);
      const href = link.attr("href") || "";
      const text = link.text().trim();

      if (
        text.toLowerCase().includes("syllabus") &&
        (href.includes(".pdf") || href.includes("/mod/resource/"))
      ) {
        return {
          type: "pdf",
          pdfUrl: href,
          pdfName: text,
        };
      }
    }
  }

  // Strategy 2: Look for syllabus PDF in other sections
  const allSections = $("li.section.course-section");
  for (let i = 0; i < allSections.length; i++) {
    const section = allSections.eq(i);
    const sectionName = section.attr("data-sectionname") || "";

    // Check sections likely to contain syllabus
    if (
      sectionName.toLowerCase().includes("general") ||
      sectionName.toLowerCase().includes("document") ||
      sectionName.toLowerCase().includes("info")
    ) {
      const syllabusLinks = section.find("a");
      for (let j = 0; j < syllabusLinks.length; j++) {
        const link = syllabusLinks.eq(j);
        const href = link.attr("href") || "";
        const text = link.text().trim();

        if (
          text.toLowerCase().includes("syllabus") &&
          (href.includes(".pdf") || href.includes("/mod/resource/"))
        ) {
          return {
            type: "pdf",
            pdfUrl: href,
            pdfName: text,
          };
        }
      }
    }
  }

  // Strategy 3: Look for any section with substantial table content that might be syllabus
  const allTables = $("table");
  for (let i = 0; i < allTables.length; i++) {
    const table = allTables.eq(i);
    const rows = table.find("tbody tr");

    if (rows.length > 5) {
      // Substantial table
      const headers = table.find(
        "thead th, tr:first-child th, tr:first-child td",
      );
      const headerText = headers
        .map((_j, h) => $(h).text().trim().toLowerCase())
        .get()
        .join(" ");

      if (
        headerText.includes("lect") ||
        headerText.includes("week") ||
        headerText.includes("topic") ||
        headerText.includes("material") ||
        headerText.includes("description") ||
        headerText.includes("exercise")
      ) {
        const tableRows = parseSyllabusTableRows(table, $);
        if (tableRows.length > 0) {
          return { type: "table", data: tableRows };
        }
      }
    }
  }

  return { type: "none" };
}

/**
 * Parses syllabus table rows into structured data
 */
function parseSyllabusTableRows(
  table: cheerio.Cheerio<Element>,
  $: cheerio.CheerioAPI,
): SyllabusRow[] {
  const syllabusRows: SyllabusRow[] = [];
  const rows = table.find("tbody tr");

  if (!rows.length) return syllabusRows;

  rows.each((_: number, row: Element) => {
    const $row = $(row);
    const cells = $row.find("td");

    if (cells.length >= 4) {
      const lectureNum = $(cells[0]).text().trim();
      const description = $(cells[1]).html() || "";
      const materials = $(cells[2]).html() || "";
      const labExercises = $(cells[3]).html() || "";

      // Parse description for topics and quizzes
      const $desc = cheerio.load(description);
      const topics: { title: string; subtopics: string[] }[] = [];
      const quizzes: string[] = [];

      // Extract main topic
      const strongTags = $desc("strong");
      strongTags.each((_, strong) => {
        const topicTitle = $desc(strong).text().trim();
        if (topicTitle && !topicTitle.includes("Quiz")) {
          topics.push({
            title: topicTitle,
            subtopics: [],
          });
        }
      });

      // Extract subtopics from lists
      $desc("ul li").each((_, li) => {
        const subtopic = $desc(li).text().trim();
        if (subtopic && !subtopic.includes("Quiz") && topics.length > 0) {
          // Add to the last topic
          topics[topics.length - 1].subtopics.push(subtopic);
        } else if (subtopic.includes("Quiz")) {
          quizzes.push(subtopic);
        }
      });

      // Extract quiz information separately
      const quizMatch = description.match(/<strong>Quiz \d+:.*?<\/strong>/gi);
      if (quizMatch) {
        quizMatch.forEach((quiz: string) => {
          const cleanQuiz = quiz.replace(/<\/?strong>/g, "");
          quizzes.push(cleanQuiz);
        });
      }

      // Parse materials for links
      const $materials = cheerio.load(materials);
      const materialLinks: { name: string; url: string; type: string }[] = [];
      $materials("a").each((_, link) => {
        const $link = $materials(link);
        const href = $link.attr("href");
        const text = $link.text().trim();
        if (href && text) {
          materialLinks.push({
            name: text,
            url: href,
            type: href.includes("/mod/folder/")
              ? "folder"
              : href.includes("/mod/page/")
                ? "page"
                : href.includes("/mod/resource/")
                  ? "file"
                  : "unknown",
          });
        }
      });

      // Parse lab exercises for links
      const $labs = cheerio.load(labExercises);
      const labLinks: { name: string; url: string; type: string }[] = [];
      $labs("a").each((_, link) => {
        const $link = $labs(link);
        const href = $link.attr("href");
        const text = $link.text().trim();
        if (href && text) {
          labLinks.push({
            name: text,
            url: href,
            type: href.includes("/mod/folder/")
              ? "folder"
              : href.includes("/mod/page/")
                ? "page"
                : href.includes("/course/section/")
                  ? "section"
                  : href.includes("docs.google.com")
                    ? "external"
                    : "unknown",
          });
        }
      });

      // Check if this is a special row (midterm/final)
      const isSpecialRow = $row.attr("bgcolor") === "#aaf542";
      const rowType = isSpecialRow
        ? "exam"
        : lectureNum
          ? "lecture"
          : "content";

      syllabusRows.push({
        lectureNumber: lectureNum || null,
        type: rowType as "lecture" | "exam" | "content",
        topics,
        quizzes,
        materials: materialLinks,
        labExercises: labLinks,
        rawDescription: decodeHtmlEntities($desc.text()),
        rawMaterials: decodeHtmlEntities($materials.text()),
        rawLabExercises: decodeHtmlEntities($labs.text()),
        isSpecialRow,
      });
    }
  });

  return syllabusRows;
}

/**
 * Extracts quiz information from Moodle quiz page HTML
 */
export function extractQuizInfo(htmlContent: string): QuizInfo | null {
  const $ = cheerio.load(htmlContent);

  // Extract basic quiz info from meta and title
  const title = $("title").text();
  const quizNameMatch = title.match(/^[^:]*:\s*(.+?)\s*\|/);
  const quizName = quizNameMatch
    ? quizNameMatch[1].trim()
    : $(".page-context-header h1, h1.h2").first().text().trim();

  if (!quizName) return null;

  // Extract IDs from JavaScript config
  const courseIdMatch = htmlContent.match(/"courseId":(\d+)/);
  const contextInstanceMatch = htmlContent.match(/"contextInstanceId":(\d+)/);

  const courseId = courseIdMatch ? courseIdMatch[1] : "";
  const quizId = contextInstanceMatch ? contextInstanceMatch[1] : "";

  // Extract quiz description/intro
  const description = $(".quizinfo, .quiz-intro, .generalbox")
    .first()
    .text()
    .trim();

  // Extract quiz settings
  let attemptsAllowed = 1;
  let gradingMethod = "";
  let timeLimit = "";

  const quizInfoText = $.text();

  // Parse attempts allowed
  const attemptsMatch = quizInfoText.match(
    /Attempts allowed:\s*(\d+|Unlimited)/i,
  );
  if (attemptsMatch) {
    attemptsAllowed =
      attemptsMatch[1] === "Unlimited" ? -1 : parseInt(attemptsMatch[1], 10);
  }

  // Parse grading method
  const gradingMatch = quizInfoText.match(/Grading method:\s*([^\n]+)/i);
  if (gradingMatch) {
    gradingMethod = gradingMatch[1].trim();
  }

  // Parse time limit
  const timeLimitMatch = quizInfoText.match(/Time limit:\s*([^\n]+)/i);
  if (timeLimitMatch) {
    timeLimit = timeLimitMatch[1].trim();
  }

  // Extract dates
  let openDate = "";
  let closeDate = "";
  let dueDate = "";

  // Look for date information in various formats
  const dateElements = $(
    '[class*="time"], [class*="date"], [class*="due"], .quiz-dates',
  );
  dateElements.each((_, elem) => {
    const text = $(elem).text().trim();

    if (text.includes("Opened:") || text.includes("Opens:")) {
      const dateMatch = text.match(/(Opened?:\s*)(.+?)(\s*Closed?:|$)/);
      if (dateMatch) {
        openDate = dateMatch[2].trim();
      }
    }

    if (text.includes("Closed:") || text.includes("Closes:")) {
      const dateMatch = text.match(/(Closed?:\s*)(.+?)$/);
      if (dateMatch) {
        closeDate = dateMatch[1] + dateMatch[2].trim();
      }
    }

    if (text.includes("Due:")) {
      const dateMatch = text.match(/Due:\s*(.+?)$/);
      if (dateMatch) {
        dueDate = dateMatch[1].trim();
      }
    }
  });

  // Extract attempts information - look for attempt cards and tables
  const attempts: QuizAttempt[] = [];
  let currentAttempt: QuizAttempt | undefined;

  // Look for attempt cards (newer format)
  const attemptCards = $(".card")
    .has(".card-title")
    .filter((_, card) => {
      const title = $(card).find(".card-title").text();
      return title.toLowerCase().includes("attempt");
    });

  if (attemptCards.length > 0) {
    attemptCards.each((index, card) => {
      const attemptTitle = $(card).find(".card-title").text().trim();
      const attemptNumberMatch = attemptTitle.match(/attempt\s+(\d+)/i);
      const attemptNumber = attemptNumberMatch
        ? parseInt(attemptNumberMatch[1], 10)
        : index + 1;

      // Look for the quizreviewsummary table within this card
      const summaryTable = $(card).find(".quizreviewsummary");

      if (summaryTable.length > 0) {
        const attempt: QuizAttempt = {
          attemptNumber,
          status: "never_started",
        };

        // Extract data from the table rows
        summaryTable.find("tbody tr").each((_, row) => {
          const headerCell = $(row).find("th").text().trim().toLowerCase();
          const dataCell = $(row).find("td").text().trim();

          switch (headerCell) {
            case "status": {
              const statusLower = dataCell.toLowerCase();
              attempt.status = statusLower.includes("finished")
                ? "finished"
                : statusLower.includes("progress")
                  ? "in_progress"
                  : statusLower.includes("abandoned")
                    ? "abandoned"
                    : "never_started";
              break;
            }
            case "started":
              attempt.startedOn = dataCell;
              break;
            case "completed":
              attempt.completedOn = dataCell;
              break;
            case "duration":
              attempt.timeTaken = dataCell;
              break;
            case "marks": {
              attempt.marks = dataCell;
              // Extract raw scores
              const marksMatch = dataCell.match(/([0-9.]+)\/([0-9.]+)/);
              if (marksMatch) {
                attempt.rawScore = marksMatch[1];
                attempt.maxScore = marksMatch[2];
              }
              break;
            }
            case "grade": {
              attempt.grade = dataCell;
              // Extract percentage from grade
              const percentMatch = dataCell.match(/\((\d+(?:\.\d+)?)%\)/);
              if (percentMatch) {
                attempt.scorePercentage = `${percentMatch[1]}%`;
              }
              break;
            }
          }
        });

        // Look for review link
        const reviewLink = $(card).find('a[href*="/mod/quiz/review.php"]');
        if (reviewLink.length > 0) {
          attempt.reviewUrl = reviewLink.attr("href");
        }

        attempts.push(attempt);

        // Set current attempt if in progress
        if (attempt.status === "in_progress") {
          currentAttempt = attempt;
        }
      }
    });
  } else {
    // Fallback: Look for traditional table format
    const attemptsTable = $("table")
      .has("th")
      .filter((_, table) => {
        const headers = $(table)
          .find("th")
          .map((_, th) => $(th).text().toLowerCase())
          .get();
        return headers.some(
          (h) => h.includes("status") || h.includes("attempt"),
        );
      });

    if (attemptsTable.length > 0) {
      const rows = attemptsTable.find("tbody tr");

      rows.each((index, row) => {
        const cells = $(row).find("td");
        if (cells.length >= 3) {
          const status = $(cells[0]).text().trim().toLowerCase();
          const started = $(cells[1]).text().trim();
          const completed = cells.length > 2 ? $(cells[2]).text().trim() : "";
          const duration = cells.length > 3 ? $(cells[3]).text().trim() : "";
          const marks = cells.length > 4 ? $(cells[4]).text().trim() : "";
          const grade = cells.length > 5 ? $(cells[5]).text().trim() : "";

          const attempt: QuizAttempt = {
            attemptNumber: index + 1,
            status: status.includes("finished")
              ? "finished"
              : status.includes("progress")
                ? "in_progress"
                : status.includes("started")
                  ? "in_progress"
                  : "never_started",
            startedOn: started || undefined,
            completedOn: completed || undefined,
            timeTaken: duration || undefined,
            marks: marks || undefined,
            grade: grade || undefined,
          };

          attempts.push(attempt);

          // Set current attempt if in progress
          if (attempt.status === "in_progress") {
            currentAttempt = attempt;
          }
        }
      });
    }
  }

  // Determine quiz status and if user can attempt
  let status: QuizInfo["status"] = "available";
  let canAttempt = false;

  // Check for "Attempt quiz" button
  const attemptButton = $('button, .btn, input[type="submit"]').filter(
    (_, btn) => {
      const text = $(btn).text().trim().toLowerCase();
      return text.includes("attempt") && text.includes("quiz");
    },
  );

  canAttempt = attemptButton.length > 0;

  // Check for status messages
  const statusMessages = $(".quizattempt, .quiz-status, .alert")
    .text()
    .toLowerCase();

  if (
    statusMessages.includes("no more attempts") ||
    statusMessages.includes("attempts are allowed")
  ) {
    status = "completed";
    canAttempt = false;
  } else if (
    statusMessages.includes("closed") ||
    statusMessages.includes("not available")
  ) {
    status = "closed";
    canAttempt = false;
  } else if (attempts.length === 0) {
    status = "not_started";
  } else if (attempts.some((a) => a.status === "finished")) {
    status = "completed";
  }

  // Extract final grade from feedback section
  let finalGrade = "";
  let totalMarks = "";

  // Look for final grade in feedback section
  const feedbackSection = $("#feedback, .generalbox").filter((_, elem) => {
    return $(elem).text().toLowerCase().includes("final grade");
  });

  if (feedbackSection.length > 0) {
    const feedbackText = feedbackSection.text();
    const gradeMatch = feedbackText.match(
      /final grade[^:]*is\s*([0-9.]+\/[0-9.]+)/i,
    );
    if (gradeMatch) {
      finalGrade = gradeMatch[1];
      const gradeParts = gradeMatch[1].split("/");
      if (gradeParts.length === 2) {
        totalMarks = gradeParts[1];
      }
    }
  }

  // Fallback: search in general text
  if (!finalGrade) {
    const gradeMatch = $.text().match(
      /final grade[^:]*:\s*([0-9.]+\/[0-9.]+|[0-9.]+%)/i,
    );
    if (gradeMatch) {
      finalGrade = gradeMatch[1];
    }
  }

  return {
    quizId,
    quizName: decodeHtmlEntities(quizName),
    courseId,
    description: description ? decodeHtmlEntities(description) : undefined,
    attemptsAllowed,
    gradingMethod: gradingMethod || undefined,
    timeLimit: timeLimit || undefined,
    openDate: openDate || undefined,
    closeDate: closeDate || undefined,
    dueDate: dueDate || undefined,
    status,
    attempts,
    currentAttempt,
    canAttempt,
    finalGrade: finalGrade || undefined,
    totalMarks: totalMarks || undefined,
  };
}

/**
 * Extracts assignment information from Moodle assignment page HTML with MAXIMUM detail extraction
 */
export function extractAssignmentInfo(
  htmlContent: string,
): AssignmentInfo | null {
  const $ = cheerio.load(htmlContent);

  // Extract basic assignment info from meta and title
  const title = $("title").text();
  const assignmentNameMatch = title.match(/^[^:]*:\s*(.+?)\s*\|/);
  const assignmentName = assignmentNameMatch
    ? assignmentNameMatch[1].trim()
    : $(".page-context-header h1, h1.h2").first().text().trim();

  if (!assignmentName) return null;

  // Extract IDs from JavaScript config
  const courseIdMatch = htmlContent.match(/"courseId":(\d+)/);
  const contextInstanceMatch = htmlContent.match(/"contextInstanceId":(\d+)/);

  const courseId = courseIdMatch ? courseIdMatch[1] : "";
  const assignmentId = contextInstanceMatch ? contextInstanceMatch[1] : "";

  // Extract assignment description and instructions
  const descriptionElement = $(
    ".activity-description, .assignmentinfo, .assign-intro, .generalbox",
  ).first();
  const description = descriptionElement.text().trim();
  const instructions = descriptionElement.html() || "";

  // Initialize date information object
  const dates: AssignmentDates = {};

  // Extract comprehensive date information
  const activityDates = $(".activity-dates");
  if (activityDates.length > 0) {
    const dateText = activityDates.text();

    // Parse opened date
    const openedMatch = dateText.match(
      /Opened?:\s*([^\n\r]+?)(?=\s*(?:Due|Closed|$))/,
    );
    if (openedMatch) {
      dates.openDate = openedMatch[1].trim();
      dates.allowSubmissionsFrom = openedMatch[1].trim();
    }

    // Parse due date
    const dueMatch = dateText.match(/Due:\s*([^\n\r]+?)(?=\s*(?:Closed|$))/);
    if (dueMatch) {
      dates.dueDate = dueMatch[1].trim();
    }

    // Parse closed/cutoff date
    const closedMatch = dateText.match(/Closed?:\s*([^\n\r]+)/);
    if (closedMatch) {
      dates.cutoffDate = closedMatch[1].trim();
    }
  }

  // Initialize submission information object
  const submission: AssignmentSubmission = {
    submissionStatus: "new",
    files: [],
    comments: [],
  };

  // Initialize grading information object
  const grading: AssignmentGrading = {
    gradingStatus: "not_graded",
  };

  // Initialize settings object
  const settings: AssignmentSettings = {
    submissionTypes: [],
    acceptedFileTypes: [],
  };

  // Extract detailed information from submission status table
  const submissionTable = $(".submissionstatustable, .generaltable");
  if (submissionTable.length > 0) {
    submissionTable.find("tr").each((_, row) => {
      const cells = $(row).find("td, th");
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim().toLowerCase();
        const value = $(cells[1]).text().trim();
        const _valueHtml = $(cells[1]).html() || "";

        switch (label) {
          case "attempt number": {
            const attemptMatch = value.match(/(\d+)/);
            if (attemptMatch) {
              submission.attemptNumber = parseInt(attemptMatch[1], 10);
            }
            break;
          }

          case "submission status":
            if (value.toLowerCase().includes("no submissions")) {
              submission.submissionStatus = "no_submission";
            } else if (value.toLowerCase().includes("submitted")) {
              submission.submissionStatus = "submitted";
            } else if (value.toLowerCase().includes("draft")) {
              submission.submissionStatus = "draft";
            } else if (value.toLowerCase().includes("reopened")) {
              submission.submissionStatus = "reopened";
            }
            break;

          case "grading status":
            if (value.toLowerCase().includes("not graded")) {
              grading.gradingStatus = "not_graded";
            } else if (value.toLowerCase().includes("graded")) {
              grading.gradingStatus = "graded";
            } else if (value.toLowerCase().includes("needs grading")) {
              grading.gradingStatus = "needs_grading";
            }
            break;

          case "time remaining":
            dates.timeRemaining = value;
            if (value.toLowerCase().includes("overdue")) {
              dates.isOverdue = true;
              const overdueMatch = value.match(/overdue by:\s*(.+)/);
              if (overdueMatch) {
                dates.overdueBy = overdueMatch[1].trim();
              }
            } else {
              dates.isOverdue = false;
            }
            break;

          case "due date":
            dates.dueDate = value;
            break;

          case "last modified":
            if (value !== "-") {
              submission.lastModified = value;
            }
            break;

          case "submission comments": {
            // Extract comment count
            const commentMatch = value.match(/Comments \((\d+)\)/);
            if (commentMatch) {
              // Comments are present, extract them
              submission.comments = [
                {
                  content: value.replace(/Comments \(\d+\).*$/, "").trim(),
                },
              ];
            }
            break;
          }

          case "grade": {
            const gradeMatch = value.match(/([0-9.]+)\s*\/\s*([0-9.]+)/);
            if (gradeMatch) {
              grading.grade = gradeMatch[1];
              grading.maxGrade = gradeMatch[2];
              const percentage =
                (parseFloat(gradeMatch[1]) / parseFloat(gradeMatch[2])) * 100;
              grading.gradePercentage = `${percentage.toFixed(1)}%`;
            } else if (value.match(/^[0-9.]+$/)) {
              grading.grade = value;
            }
            break;
          }
        }
      }
    });
  }

  // Extract submission files
  const fileElements = $(
    'a[href*="pluginfile"], a[href*="download"], .fileuploadsubmission',
  );
  fileElements.each((_, elem) => {
    const $elem = $(elem);
    const href = $elem.attr("href");
    const text = $elem.text().trim();
    const _className = $elem.attr("class") || "";

    if (href && text && !href.includes("mobile") && !text.includes("mobile")) {
      const file: SubmissionFile = {
        name: text,
        url: href,
      };

      // Try to extract file size if available
      const sizeMatch = $elem
        .parent()
        .text()
        .match(/\((\d+[\w\s]+)\)/);
      if (sizeMatch) {
        file.size = sizeMatch[1];
      }

      // Determine file type from extension
      const extensionMatch = text.match(/\.(\w+)$/);
      if (extensionMatch) {
        file.type = extensionMatch[1].toUpperCase();
      }

      submission.files?.push(file);
    }
  });

  // Extract upload dates for files
  const uploadDateElements = $(".fileuploadsubmissiontime");
  uploadDateElements.each((_, elem) => {
    const dateText = $(elem).text().trim();
    if (dateText && submission.files && submission.files.length > 0) {
      // Associate with the most recent file
      submission.files[submission.files.length - 1].uploadDate = dateText;
    }
  });

  // Extract feedback information
  const feedbackElements = $('.feedback, [class*="feedback"], .assignfeedback');
  if (feedbackElements.length > 0) {
    grading.feedback = feedbackElements.first().text().trim();
  }

  // Extract assignment settings from text content
  const fullText = $.text();

  // Look for submission types
  const submissionTypeMatch = fullText.match(
    /Submission types?:\s*([^\n\r]+)/i,
  );
  if (submissionTypeMatch) {
    settings.submissionTypes = submissionTypeMatch[1]
      .split(",")
      .map((s) => s.trim());
  }

  // Look for file size limits
  const fileSizeMatch = fullText.match(/Maximum file size:\s*([^\n\r]+)/i);
  if (fileSizeMatch) {
    settings.maxFileSize = fileSizeMatch[1].trim();
  }

  // Look for maximum number of files
  const maxFilesMatch = fullText.match(/Maximum number of files:\s*(\d+)/i);
  if (maxFilesMatch) {
    settings.maxFiles = parseInt(maxFilesMatch[1], 10);
  }

  // Look for attempts allowed
  const attemptsMatch = fullText.match(/Attempts allowed:\s*(\d+|Unlimited)/i);
  let attemptsAllowed: number | undefined;
  if (attemptsMatch) {
    attemptsAllowed =
      attemptsMatch[1] === "Unlimited" ? -1 : parseInt(attemptsMatch[1], 10);
  }

  // Check for various settings
  settings.requireClickSubmit = fullText.includes(
    "Require students click submit",
  );
  settings.requireAcceptance = fullText.includes(
    "Require that students accept",
  );
  settings.groupSubmission = fullText.includes("Group submission");
  settings.preventLateSubmissions = fullText.includes(
    "Prevent late submissions",
  );

  // Determine if user can submit
  const canSubmit =
    $("button, .btn").filter((_, btn) => {
      const text = $(btn).text().trim().toLowerCase();
      return (
        text.includes("add submission") || text.includes("edit submission")
      );
    }).length > 0;

  // Determine if user can edit
  const canEdit =
    $("button, .btn").filter((_, btn) => {
      const text = $(btn).text().trim().toLowerCase();
      return text.includes("edit submission");
    }).length > 0;

  // Determine activity status
  let activityStatus: AssignmentInfo["activityStatus"] = "open";
  if (dates.isOverdue && !canSubmit) {
    activityStatus = "closed";
  } else if (dates.openDate && new Date(dates.openDate) > new Date()) {
    activityStatus = "not_yet_open";
  }

  // Determine completion status
  let completionStatus: AssignmentInfo["completionStatus"] = "not_attempted";
  if (submission.submissionStatus === "submitted") {
    completionStatus = "complete";
  } else if (
    submission.submissionStatus === "draft" ||
    submission.submissionStatus === "reopened"
  ) {
    completionStatus = "incomplete";
  }

  return {
    assignmentId,
    assignmentName: decodeHtmlEntities(assignmentName),
    courseId,
    description: description ? decodeHtmlEntities(description) : undefined,
    instructions: instructions ? decodeHtmlEntities(instructions) : undefined,

    dates,
    submission,
    grading,
    settings,

    attemptsAllowed,
    attemptsUsed: submission.attemptNumber,
    canSubmit,
    canEdit,
    hasExtension: false, // Would need additional logic to detect extensions

    activityStatus,
    completionStatus,
  };
}

/**
 * Extracts course content from Moodle course page HTML
 */
export function extractCourseContent(
  htmlContent: string,
): CourseContent | null {
  const $ = cheerio.load(htmlContent);

  // Extract course name - improved extraction
  let courseName = "";

  // Try multiple selectors for course name
  courseName = $("h1.h2.mb-0").first().text().trim();
  if (!courseName) {
    courseName = $(".page-context-header h1").first().text().trim();
  }
  if (!courseName) {
    courseName = $("h1.page-context-header").first().text().trim();
  }
  if (!courseName) {
    courseName = $("title")
      .text()
      .replace(/Course:\s*/, "")
      .replace(/\s*\|.*$/, "")
      .trim();
  }

  if (!courseName) return null;

  // Extract course ID from URL or meta tags
  const courseIdMatch =
    htmlContent.match(/"courseId":(\d+)/) ||
    htmlContent.match(/course\/view\.php\?id=(\d+)/);
  const courseId = courseIdMatch ? courseIdMatch[1] : "";

  // Extract attendance info if available - improved extraction
  let attendanceInfo:
    | { current: number; total: number; percentage: number }
    | undefined;

  // Try multiple selectors for attendance
  let attendanceText = $(".float-right a").text();
  if (!attendanceText) {
    attendanceText = $(".float-right").text();
  }
  if (!attendanceText) {
    attendanceText = $("a[href*='attendance']").text();
  }
  if (!attendanceText) {
    // Look for attendance pattern anywhere in the page
    const pageText = $.text();
    const globalMatch = pageText.match(/(\d+)\/(\d+)\s*\((\d+)%\)/);
    if (globalMatch) {
      attendanceText = globalMatch[0];
    }
  }

  const attendanceMatch = attendanceText.match(/(\d+)\/(\d+)\s*\((\d+)%\)/);
  if (attendanceMatch) {
    attendanceInfo = {
      current: parseInt(attendanceMatch[1], 10),
      total: parseInt(attendanceMatch[2], 10),
      percentage: parseInt(attendanceMatch[3], 10),
    };
  }

  const sections: CourseSection[] = [];

  // Process each section - improved extraction
  $("li.section.course-section").each((_, sectionElement) => {
    const $section = $(sectionElement);
    const sectionId = $section.attr("data-id") || "";
    const sectionNumber = parseInt($section.attr("data-number") || "0", 10);

    // Improved section name extraction
    let sectionName = "";

    // Try multiple selectors for section name
    sectionName = $section.find(".sectionname a").text().trim();
    if (!sectionName) {
      sectionName = $section.find("h3.sectionname a").text().trim();
    }
    if (!sectionName) {
      sectionName = $section.attr("data-sectionname") || "";
    }
    if (!sectionName) {
      sectionName = $section.find("[data-for='section_title'] a").text().trim();
    }

    // Extract section summary - improved to handle different formats
    let summary = $section.find(".summarytext .no-overflow").text().trim();
    if (!summary) {
      summary = $section.find(".summarytext").text().trim();
    }
    if (!summary) {
      summary = $section.find("[data-for='sectioninfo']").text().trim();
    }

    // Check if section is collapsed
    const collapsed = $section.find(".collapse").hasClass("show") === false;

    const activities: CourseActivity[] = [];

    // Process activities in this section - improved extraction
    $section.find(".activity").each((_, activityElement) => {
      const $activity = $(activityElement);
      const moduleId = $activity.attr("data-id") || "";
      const activityId = $activity.attr("id") || "";

      // Extract activity type from classes - improved pattern matching
      const classList = $activity.attr("class") || "";
      const typeMatch = classList.match(/modtype_(\w+)/);
      const type = typeMatch ? typeMatch[1] : "unknown";

      // Extract activity name - improved selector and cleaning
      let name = "";
      const nameElement = $activity.find(".instancename").first();
      if (nameElement.length) {
        // Get the full text and clean it
        name = nameElement.text().trim();
        // Remove accessibility text in span.accesshide
        const accessHideText = nameElement.find(".accesshide").text().trim();
        if (accessHideText) {
          name = name.replace(accessHideText, "").trim();
        }
      }

      // If name is still empty, try alternative selectors
      if (!name) {
        name =
          $activity.find("[data-activityname]").attr("data-activityname") || "";
      }

      // If still empty, try the activity title
      if (!name) {
        name = $activity.find(".activitytitle").text().trim();
      }

      // Extract URL - improved selector
      let url = $activity.find("a.aalink").attr("href") || "";
      if (!url) {
        url = $activity.find("a[href*='/mod/']").first().attr("href") || "";
      }

      // Extract icon
      const icon = $activity.find(".activityicon").attr("src") || "";

      // Extract dates - improved parsing
      let dueDate: string | undefined,
        openDate: string | undefined,
        closeDate: string | undefined;
      $activity
        .find("[data-region='activity-dates'] div")
        .each((_, dateDiv) => {
          const dateText = $(dateDiv).text();
          if (dateText.includes("Due:")) {
            dueDate = dateText.replace(/^.*Due:\s*/, "").trim();
          } else if (
            dateText.includes("Opens:") ||
            dateText.includes("Opened:")
          ) {
            openDate = dateText.replace(/^.*(Opens?:|Opened:)\s*/, "").trim();
          } else if (
            dateText.includes("Closes:") ||
            dateText.includes("Closed:")
          ) {
            closeDate = dateText.replace(/^.*(Closes?:|Closed:)\s*/, "").trim();
          }
        });

      // Extract availability info
      const availability = $activity
        .find("[data-region='availabilityinfo']")
        .text()
        .trim();

      // Only add if we have essential data
      if (name && (moduleId || activityId)) {
        const activity: CourseActivity = {
          id: activityId || `activity-${moduleId}`,
          name: decodeHtmlEntities(name),
          type,
          moduleId: moduleId || activityId,
          url,
          icon,
          dueDate,
          openDate,
          closeDate,
          availability: availability || undefined,
        };

        activities.push(activity);
      }
    });

    // Also look for activities that might not have the standard .activity class
    // but are still course modules (like labels, subsections, etc.)
    $section.find("li[data-for='cmitem']").each((_, moduleElement) => {
      const $module = $(moduleElement);
      const moduleId = $module.attr("data-id") || "";
      const activityId = $module.attr("id") || "";

      // Skip if we already processed this module
      if (activities.find((a) => a.moduleId === moduleId)) {
        return;
      }

      // Extract activity type from classes
      const classList = $module.attr("class") || "";
      const typeMatch = classList.match(/modtype_(\w+)/);
      const type = typeMatch ? typeMatch[1] : "unknown";

      // Extract activity name
      let name = "";
      const nameElement = $module.find(".instancename").first();
      if (nameElement.length) {
        name = nameElement.text().trim();
        const accessHideText = nameElement.find(".accesshide").text().trim();
        if (accessHideText) {
          name = name.replace(accessHideText, "").trim();
        }
      }

      if (!name) {
        name =
          $module.find("[data-activityname]").attr("data-activityname") || "";
      }

      // Extract URL
      let url = $module.find("a.aalink").attr("href") || "";
      if (!url) {
        url = $module.find("a[href*='/mod/']").first().attr("href") || "";
      }

      // Extract icon
      const icon = $module.find(".activityicon").attr("src") || "";

      if (name && moduleId) {
        const activity: CourseActivity = {
          id: activityId || `module-${moduleId}`,
          name: decodeHtmlEntities(name),
          type,
          moduleId,
          url,
          icon,
        };

        activities.push(activity);
      }
    });

    // Extract activities from section summary links (like Course Syllabus)
    const summaryElement = $section.find(".summarytext .no-overflow");
    if (summaryElement.length) {
      summaryElement.find('a[href*="/mod/"]').each((_, linkElement) => {
        const $link = $(linkElement);
        const linkUrl = $link.attr("href");
        const linkText = $link.text().trim();

        if (linkUrl && linkText && linkUrl.includes("/mod/")) {
          // Extract module type and ID from URL
          const moduleMatch = linkUrl.match(
            /\/mod\/(\w+)\/view\.php\?id=(\d+)/,
          );
          if (moduleMatch) {
            const moduleType = moduleMatch[1];
            const moduleId = moduleMatch[2];

            // Generate activity ID
            const activityId = `summary-activity-${moduleId}`;

            // Determine icon based on module type
            const iconMap: Record<string, string> = {
              resource:
                "https://mycourses.ict.mahidol.ac.th/theme/image.php/boost/core/1756095930/f/pdf?filtericon=1",
              quiz: "https://mycourses.ict.mahidol.ac.th/theme/image.php/boost/quiz/1756095930/monologo?filtericon=1",
              forum:
                "https://mycourses.ict.mahidol.ac.th/theme/image.php/boost/forum/1756095930/monologo?filtericon=1",
              assign:
                "https://mycourses.ict.mahidol.ac.th/theme/image.php/boost/assign/1756095930/monologo?filtericon=1",
              folder:
                "https://mycourses.ict.mahidol.ac.th/theme/image.php/boost/folder/1756095930/monologo?filtericon=1",
              page: "https://mycourses.ict.mahidol.ac.th/theme/image.php/boost/page/1756095930/monologo?filtericon=1",
              url: "https://mycourses.ict.mahidol.ac.th/theme/image.php/boost/url/1756095930/monologo?filtericon=1",
            };

            // Check if this activity is already added from standard parsing
            const existingActivity = activities.find(
              (a) => a.moduleId === moduleId,
            );
            if (!existingActivity) {
              const activity: CourseActivity = {
                id: activityId,
                name: decodeHtmlEntities(linkText),
                type: moduleType,
                moduleId: moduleId,
                url: linkUrl,
                icon: iconMap[moduleType] || "",
              };

              activities.push(activity);
            }
          }
        }
      });
    }

    // Handle complex section titles (like "cDuck ExtensionDownloadInstallationUsage")
    let cleanSectionName = sectionName;
    if (sectionName.includes("cDuck") && sectionName.length > 20) {
      cleanSectionName = "cDuck Extension";
    }

    // Handle other complex concatenated section names
    if (
      sectionName.includes("Assignment Submissions") &&
      sectionName.length > 30
    ) {
      const parts = sectionName.split("Assignment Submissions");
      if (parts.length > 1) {
        cleanSectionName = `${parts[0].trim()} Assignment Submissions`;
      }
    }

    // Special handling for syllabus information
    let syllabusData: SyllabusRow[] | null = null;
    let syllabusInfo: SyllabusInfo | undefined;

    if (
      sectionName === "Course Syllabus" ||
      cleanSectionName === "Course Syllabus"
    ) {
      syllabusInfo = parseSyllabusInfo($.html());
      if (syllabusInfo.type === "table" && syllabusInfo.data) {
        syllabusData = syllabusInfo.data;
      }
    }

    // Add section even if name is empty (some sections might be unnamed)
    if (sectionId || sectionNumber >= 0) {
      sections.push({
        id: sectionId || `section-${sectionNumber}`,
        number: sectionNumber,
        name: cleanSectionName
          ? decodeHtmlEntities(cleanSectionName)
          : `Section ${sectionNumber}`,
        summary: summary ? decodeHtmlEntities(summary) : undefined,
        activities,
        collapsed,
        syllabusData,
        syllabusInfo,
      });
    }
  });

  // Extract AI level info
  const aiLevel = extractAILevel(htmlContent) || undefined;

  return {
    courseId,
    courseName: decodeHtmlEntities(courseName),
    sections,
    attendanceInfo,
    aiLevel,
  };
}

import * as cheerio from "cheerio";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export interface AbsentRecord {
  date: string;
  status: string;
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
}

export interface CourseSection {
  id: string;
  number: number;
  name: string;
  summary?: string;
  activities: CourseActivity[];
  collapsed?: boolean;
  syllabusData?: SyllabusRow[] | null;
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
 * Parses syllabus table from Course Syllabus section
 */
function parseSyllabusTable(html: string): SyllabusRow[] {
  const $ = cheerio.load(html);
  const syllabusRows: SyllabusRow[] = [];

  // Find the syllabus table in Course Syllabus section
  const syllabusSection = $('li[data-sectionname="Course Syllabus"]');
  const table = syllabusSection.find("table").first();

  if (table.length) {
    const rows = table.find("tbody tr");

    rows.each((_, row) => {
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
          quizMatch.forEach((quiz) => {
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
  }

  return syllabusRows;
}

/**
 * Extracts course content from Moodle course page HTML
 */
export function extractCourseContent(
  htmlContent: string,
): CourseContent | null {
  const $ = cheerio.load(htmlContent);

  // Extract course name
  const courseName =
    $("h1.h2.mb-0").first().text().trim() ||
    $(".page-context-header h1").first().text().trim();

  if (!courseName) return null;

  // Extract course ID from URL or meta tags
  const courseIdMatch =
    htmlContent.match(/"courseId":(\d+)/) ||
    htmlContent.match(/course\/view\.php\?id=(\d+)/);
  const courseId = courseIdMatch ? courseIdMatch[1] : "";

  // Extract attendance info if available
  let attendanceInfo:
    | { current: number; total: number; percentage: number }
    | undefined;
  const attendanceText = $(".float-right a").text();
  const attendanceMatch = attendanceText.match(/(\d+)\/(\d+)\s*\((\d+)%\)/);
  if (attendanceMatch) {
    attendanceInfo = {
      current: parseInt(attendanceMatch[1], 10),
      total: parseInt(attendanceMatch[2], 10),
      percentage: parseInt(attendanceMatch[3], 10),
    };
  }

  const sections: CourseSection[] = [];

  // Process each section
  $("li.section.course-section").each((_, sectionElement) => {
    const $section = $(sectionElement);
    const sectionId = $section.attr("data-id") || "";
    const sectionNumber = parseInt($section.attr("data-number") || "0", 10);
    const sectionName =
      $section.find(".sectionname a").text().trim() ||
      $section.attr("data-sectionname") ||
      "";

    // Extract section summary
    const summary = $section.find(".summarytext .no-overflow").text().trim();

    // Check if section is collapsed
    const collapsed = $section.find(".collapse").hasClass("show") === false;

    const activities: CourseActivity[] = [];

    // Process activities in this section
    $section.find(".activity").each((_, activityElement) => {
      const $activity = $(activityElement);
      const moduleId = $activity.attr("data-id") || "";
      const activityId = $activity.attr("id") || "";

      // Extract activity type from classes
      const classList = $activity.attr("class") || "";
      const typeMatch = classList.match(/modtype_(\w+)/);
      const type = typeMatch ? typeMatch[1] : "unknown";

      // Extract activity name
      const nameElement = $activity.find(".instancename");
      let name = nameElement.text().trim();
      // Clean up name by removing access hide text
      name = name
        .replace(
          /\s*(Forum|File|Assignment|Quiz|Folder|Page|URL|Choice)\s*$/,
          "",
        )
        .trim();

      // Extract URL
      const url = $activity.find("a.aalink").attr("href") || "";

      // Extract icon
      const icon = $activity.find(".activityicon").attr("src") || "";

      // Extract dates
      let dueDate: string | undefined,
        openDate: string | undefined,
        closeDate: string | undefined;
      $activity
        .find("[data-region='activity-dates'] div")
        .each((_, dateDiv) => {
          const dateText = $(dateDiv).text();
          if (dateText.includes("Due:")) {
            dueDate = dateText.replace("Due:", "").trim();
          } else if (
            dateText.includes("Opens:") ||
            dateText.includes("Opened:")
          ) {
            openDate = dateText.replace(/Opens?:|Opened:/, "").trim();
          } else if (
            dateText.includes("Closes:") ||
            dateText.includes("Closed:")
          ) {
            closeDate = dateText.replace(/Closes?:|Closed:/, "").trim();
          }
        });

      // Extract availability info
      const availability = $activity
        .find("[data-region='availabilityinfo']")
        .text()
        .trim();

      if (name && moduleId) {
        activities.push({
          id: activityId,
          name: decodeHtmlEntities(name),
          type,
          moduleId,
          url,
          icon,
          dueDate,
          openDate,
          closeDate,
          availability: availability || undefined,
        });
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
              activities.push({
                id: activityId,
                name: decodeHtmlEntities(linkText),
                type: moduleType,
                moduleId: moduleId,
                url: linkUrl,
                icon: iconMap[moduleType] || "",
              });
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

    // Special handling for Course Syllabus section
    let syllabusData: SyllabusRow[] | null = null;
    if (sectionName === "Course Syllabus") {
      syllabusData = parseSyllabusTable($.html());
    }

    if (cleanSectionName && sectionId) {
      sections.push({
        id: sectionId,
        number: sectionNumber,
        name: decodeHtmlEntities(cleanSectionName),
        summary: summary ? decodeHtmlEntities(summary) : undefined,
        activities,
        collapsed,
        syllabusData,
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

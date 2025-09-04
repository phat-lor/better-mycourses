import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import axios from "axios";
import * as cheerio from "cheerio";
import { Elysia, t } from "elysia";
import { CookieJar } from "tough-cookie";
import { CACHE_TTL, cache } from "@/utils/cache";
import {
  decodeHtmlEntities,
  extractAbsentRecords,
  extractAILevel,
  extractCourseContent,
  extractSesskey,
  extractUserProfile,
} from "@/utils/moodleParser";

// Helper to set cache headers
const setCacheHeaders = (
  set: Record<string, unknown>,
  ttl: number,
  etag?: string,
  cached = false,
) => {
  set.headers = {
    ...((set.headers as object) || {}),
    "Cache-Control": `private, max-age=${ttl}`,
    "X-Cache": cached ? "HIT" : "MISS",
    ...(etag && { ETag: etag }),
  };
};

// Helper to check conditional requests
const checkConditional = (
  headers: Record<string, string | undefined>,
  etag: string,
) => {
  const ifNoneMatch = headers["if-none-match"];
  return ifNoneMatch === etag;
};

// Setup axios with cookie jar support
const axiosCookieJarSupport = require("axios-cookiejar-support");
axiosCookieJarSupport.wrapper(axios);

const myCourses = axios.create({
  baseURL: "https://mycourses.ict.mahidol.ac.th/",
  maxRedirects: 0,
  validateStatus: (status) => status < 400 || status === 302,
});

// Validate session and get current data
async function validateSession(moodleSession: string) {
  const cacheKey = cache.sessionKey(moodleSession, "validation");

  // Check cache first
  const cachedValidation = cache.get(cacheKey) as {
    sesskey?: string;
    timestamp: number;
  } | null;
  if (cachedValidation) {
    return cachedValidation.sesskey;
  }

  myCourses.defaults.headers.Cookie = `MoodleSession=${moodleSession}`;
  const res = await myCourses.get("/user/profile.php");

  if (res.status === 302) {
    throw new Error("Session expired");
  }

  const sesskey = extractSesskey(res.data) ?? undefined;

  // Cache session validation for 5 minutes
  cache.set(
    cacheKey,
    { sesskey, timestamp: Date.now() },
    { ttl: CACHE_TTL.MEDIUM },
  );

  return sesskey;
}

// JWT payload interface
interface JWTPayload {
  moodleSession: string;
  sesskey?: string;
}

// Authentication middleware
const authMiddleware = async ({
  headers,
  jwt: jwtInstance,
  set,
}: {
  headers: Record<string, string | undefined>;
  jwt: {
    verify: (token: string) => Promise<unknown>;
  };
  set: Record<string, unknown>;
}) => {
  const authorization = headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    set.status = 401;
    return {
      success: false,
      error: "No authorization token provided",
      message: "Authentication required",
    };
  }

  const token = authorization.substring(7);

  try {
    const payload = await jwtInstance.verify(token);
    if (
      !payload ||
      typeof payload === "boolean" ||
      typeof payload !== "object" ||
      !("moodleSession" in payload)
    ) {
      throw new Error("Invalid token payload");
    }
    return { payload: payload as unknown as JWTPayload };
  } catch {
    set.status = 401;
    return {
      success: false,
      error: "Invalid or expired token",
      message: "Authentication failed",
    };
  }
};

// Response schemas

const CheckResponse = t.Object({
  success: t.Boolean(),
  isAuthenticated: t.Boolean(),
  sesskey: t.Optional(t.String()),
  sesskeyChanged: t.Optional(t.Boolean()),
  message: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

const UserProfileResponse = t.Object({
  success: t.Boolean(),
  profile: t.Optional(
    t.Object({
      firstName: t.String(),
      lastName: t.String(),
      email: t.String(),
    }),
  ),
  message: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

const CourseResponse = t.Object({
  success: t.Boolean(),
  courses: t.Optional(
    t.Array(
      t.Object({
        id: t.Number(),
        fullname: t.String(),
        shortname: t.String(),
        idnumber: t.String(),
        summary: t.String(),
        summaryformat: t.Number(),
        startdate: t.Number(),
        enddate: t.Number(),
        visible: t.Boolean(),
        fullnamedisplay: t.String(),
        viewurl: t.String(),
        courseimage: t.String(),
        progress: t.Number(),
        hasprogress: t.Boolean(),
        isfavourite: t.Boolean(),
        hidden: t.Boolean(),
        showshortname: t.Boolean(),
        coursecategory: t.String(),
      }),
    ),
  ),
  nextoffset: t.Optional(t.Number()),
  message: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

const AttendanceResponse = t.Object({
  success: t.Boolean(),
  attendance: t.Optional(
    t.Array(
      t.Object({
        date: t.String(),
        status: t.String(),
      }),
    ),
  ),
  message: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

const SyllabusRowSchema = t.Object({
  lectureNumber: t.Union([t.String(), t.Null()]),
  type: t.Union([
    t.Literal("lecture"),
    t.Literal("exam"),
    t.Literal("content"),
  ]),
  topics: t.Array(
    t.Object({
      title: t.String(),
      subtopics: t.Array(t.String()),
    }),
  ),
  quizzes: t.Array(t.String()),
  materials: t.Array(
    t.Object({
      name: t.String(),
      url: t.String(),
      type: t.String(),
    }),
  ),
  labExercises: t.Array(
    t.Object({
      name: t.String(),
      url: t.String(),
      type: t.String(),
    }),
  ),
  rawDescription: t.String(),
  rawMaterials: t.String(),
  rawLabExercises: t.String(),
  isSpecialRow: t.Boolean(),
});

const CourseContentResponse = t.Object({
  success: t.Boolean(),
  content: t.Optional(
    t.Object({
      courseId: t.String(),
      courseName: t.String(),
      sections: t.Array(
        t.Object({
          id: t.String(),
          number: t.Number(),
          name: t.String(),
          summary: t.Optional(t.String()),
          activities: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
              type: t.String(),
              moduleId: t.String(),
              url: t.String(),
              description: t.Optional(t.String()),
              dueDate: t.Optional(t.String()),
              openDate: t.Optional(t.String()),
              closeDate: t.Optional(t.String()),
              availability: t.Optional(t.String()),
              icon: t.Optional(t.String()),
            }),
          ),
          collapsed: t.Optional(t.Boolean()),
          syllabusData: t.Optional(
            t.Union([t.Array(SyllabusRowSchema), t.Null()]),
          ),
        }),
      ),
      attendanceInfo: t.Optional(
        t.Object({
          current: t.Number(),
          total: t.Number(),
          percentage: t.Number(),
        }),
      ),
      aiLevel: t.Optional(
        t.Object({
          level: t.Number(),
          description: t.String(),
          color: t.String(),
        }),
      ),
    }),
  ),
  message: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

const CredentialsLoginResponse = t.Object({
  success: t.Boolean(),
  token: t.Optional(t.String()),
  moodleSession: t.Optional(t.String()),
  sesskey: t.Optional(t.String()),
  message: t.String(),
  error: t.Optional(t.String()),
});

const SessionLoginResponse = t.Object({
  success: t.Boolean(),
  token: t.Optional(t.String()),
  sesskey: t.Optional(t.String()),
  message: t.String(),
  error: t.Optional(t.String()),
});

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: true,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  )
  .onAfterHandle(({ set }) => {
    // Add security headers to all responses
    const headers = (set.headers as Record<string, string>) || {};
    set.headers = {
      ...headers,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
    };
  })
  .use(
    swagger({
      documentation: {
        info: {
          title: "Better MyCourses API",
          version: "1.0.0",
          description: "API for Better MyCourses application",
        },
        servers: [
          {
            url: "http://localhost:3000",
            description: "Development server",
          },
          {
            url: "https://mycourses.phatlor.me/",
            description: "Production server",
          },
        ],
        tags: [
          { name: "auth", description: "Authentication endpoints" },
          { name: "user", description: "User management endpoints" },
          {
            name: "course",
            description: "Course content and structure endpoints",
          },
          { name: "attendance", description: "Course attendance endpoints" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }),
  )
  .use(
    jwt({
      name: "jwt",
      secret:
        process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-change-this-in-production",
    }),
  )

  // Health check
  .get("/", () => ({ message: "Better MyCourses API", status: "online" }))

  // Auth endpoints
  .post(
    "/auth/credentials",
    async ({ body, jwt: jwtInstance }) => {
      const { username, password } = body;

      try {
        const cookieJar = new CookieJar();
        const session = axios.create({
          withCredentials: true,
          timeout: 30000,
          maxRedirects: 10,
        });
        (session.defaults as unknown as { jar: CookieJar }).jar = cookieJar;

        const headers = {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "no-cache",
        };

        // Get initial login redirect
        const loginUrl =
          "https://mycourses.ict.mahidol.ac.th/auth/saml2/login.php?wants=https%3A%2F%2Fmycourses.ict.mahidol.ac.th%2F&idp=333b5ee96be2a2062bb8ca7793f7212d&passive=off";
        let response = await session.get(loginUrl, {
          headers,
          maxRedirects: 0,
          validateStatus: (status) => status < 400,
        });

        // Follow to ADFS
        const adfsUrl =
          response.headers.location || response.request.responseURL;
        response = await session.get(adfsUrl, { headers });

        // Parse ADFS form
        const $ = cheerio.load(response.data);
        const form = $("form").first();
        let actionUrl = form.attr("action") || adfsUrl;

        if (actionUrl.startsWith("/")) {
          const adfsUrlObj = new URL(adfsUrl);
          actionUrl = `${adfsUrlObj.protocol}//${adfsUrlObj.host}${actionUrl}`;
        }

        // Submit credentials
        const credentials = new URLSearchParams({
          _UserName: username,
          Password: password,
          AuthMethod: "FormsAuthentication",
          UserName: `STUDENT\\${username}`,
        });

        response = await session.post(actionUrl, credentials.toString(), {
          headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: adfsUrl,
          },
        });

        // Handle SAML response
        const $saml = cheerio.load(response.data);
        const samlForm = $saml('form input[name="SAMLResponse"]').closest(
          "form",
        );

        if (!samlForm.length) {
          throw new Error("Invalid credentials");
        }

        const samlResponse = samlForm
          .find('input[name="SAMLResponse"]')
          .attr("value");
        const relayState = samlForm
          .find('input[name="RelayState"]')
          .attr("value");
        const samlUrl = samlForm.attr("action");

        if (!samlResponse || !relayState || !samlUrl) {
          throw new Error("Missing SAML data");
        }

        const samlData = new URLSearchParams({
          SAMLResponse: samlResponse,
          RelayState: relayState,
        });

        response = await session.post(samlUrl, samlData.toString(), {
          headers: {
            ...headers,
            Origin: "https://idp.mahidol.ac.th",
            Referer: "https://idp.mahidol.ac.th/",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        // Get final dashboard
        response = await session.get(
          "https://mycourses.ict.mahidol.ac.th/my/",
          { headers },
        );

        // Extract session cookie
        const cookies_jar = await cookieJar.getCookies(
          "https://mycourses.ict.mahidol.ac.th/",
        );
        const moodleSession = cookies_jar.find(
          (c) => c.key === "MoodleSession",
        )?.value;

        if (!moodleSession) {
          throw new Error("Login failed");
        }

        const sesskey = extractSesskey(response.data);

        // Create JWT token
        const token = await jwtInstance.sign({
          moodleSession,
          sesskey,
        });

        return {
          success: true,
          token,
          moodleSession,
          sesskey: sesskey ?? undefined,
          message: "Login successful",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Login failed",
          message: "Authentication failed",
        };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
      response: CredentialsLoginResponse,
      detail: { summary: "Login with credentials", tags: ["auth"] },
    },
  )

  .post(
    "/auth/session",
    async ({ body, jwt: jwtInstance }) => {
      const { moodleSession } = body;

      try {
        const sesskey = await validateSession(moodleSession);

        // Create JWT token
        const token = await jwtInstance.sign({
          moodleSession,
          sesskey,
        });

        return {
          success: true,
          token,
          sesskey: sesskey ?? undefined,
          message: "Session authenticated successfully",
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Session validation failed",
          message: "Authentication failed",
        };
      }
    },
    {
      body: t.Object({
        moodleSession: t.String({ minLength: 1 }),
      }),
      response: SessionLoginResponse,
      detail: { summary: "Authenticate with session token", tags: ["auth"] },
    },
  )

  .get(
    "/auth/check",
    async ({ headers, jwt: jwtInstance }) => {
      try {
        const authorization = headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
          return {
            success: false,
            error: "No authorization token provided",
            isAuthenticated: false,
            message: "No active session",
          };
        }

        const token = authorization.substring(7);
        const payload = await jwtInstance.verify(token);
        if (
          !payload ||
          typeof payload === "boolean" ||
          !("moodleSession" in payload)
        ) {
          throw new Error("Invalid token payload");
        }
        const jwtPayload = payload as unknown as JWTPayload;

        const currentSesskey = await validateSession(jwtPayload.moodleSession);

        return {
          success: true,
          isAuthenticated: true,
          sesskey: currentSesskey ?? undefined,
          sesskeyChanged: jwtPayload.sesskey !== currentSesskey,
          message: "Session is valid",
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Session check failed",
          isAuthenticated: false,
          message: "Session verification failed",
        };
      }
    },
    {
      response: CheckResponse,
      detail: { summary: "Check session validity", tags: ["auth"] },
    },
  )

  .post(
    "/auth/logout",
    async ({ headers, jwt: jwtInstance }) => {
      try {
        const authorization = headers.authorization;
        if (authorization?.startsWith("Bearer ")) {
          const token = authorization.substring(7);
          const payload = await jwtInstance.verify(token);
          if (
            payload &&
            typeof payload === "object" &&
            "moodleSession" in payload
          ) {
            const jwtPayload = payload as unknown as JWTPayload;
            cache.clearUser(jwtPayload.moodleSession);
          }
        }
      } catch {
        // Continue with logout even if cache clearing fails
      }

      return { success: true, message: "Logged out successfully" };
    },
    {
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
      detail: { summary: "Logout user", tags: ["auth"] },
    },
  )

  // Cache management endpoint
  .delete(
    "/cache/clear",
    async ({ headers, jwt: jwtInstance, set }) => {
      const authResult = await authMiddleware({
        headers,
        jwt: jwtInstance,
        set,
      });
      if (!authResult.payload) return authResult;

      try {
        const { moodleSession } = authResult.payload;
        cache.clearUser(moodleSession);

        return {
          success: true,
          message: "Cache cleared successfully",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Cache clear failed",
          message: "Failed to clear cache",
        };
      }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
        error: t.Optional(t.String()),
      }),
      detail: { summary: "Clear user cache", tags: ["user"] },
    },
  )

  // User endpoints
  .get(
    "/user/profile",
    async ({ headers, jwt: jwtInstance, set }) => {
      const authResult = await authMiddleware({
        headers,
        jwt: jwtInstance,
        set,
      });
      if (!authResult.payload) return authResult;

      try {
        const { moodleSession } = authResult.payload;
        const cacheKey = cache.userKey(moodleSession, "profile");

        const { data, etag, cached } = await cache.withCache(
          cacheKey,
          async () => {
            myCourses.defaults.headers.Cookie = `MoodleSession=${moodleSession}`;
            const res = await myCourses.get("/user/profile.php");

            if (res.status === 302) {
              throw new Error("Session expired");
            }

            return {
              success: true,
              profile: extractUserProfile(res.data) ?? undefined,
            };
          },
          CACHE_TTL.LONG,
        );

        // Check conditional request
        if (checkConditional(headers, etag)) {
          setCacheHeaders(set, CACHE_TTL.LONG, etag, true);
          set.status = 304;
          return new Response(null, { status: 304 });
        }

        setCacheHeaders(set, CACHE_TTL.LONG, etag, cached);
        return data;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Profile fetch failed",
          message: "Could not fetch user profile",
        };
      }
    },
    {
      response: UserProfileResponse,
      detail: { summary: "Get user profile", tags: ["user"] },
    },
  )

  // Course endpoints
  .get(
    "/courses",
    async ({ headers, jwt: jwtInstance, set }) => {
      const authResult = await authMiddleware({
        headers,
        jwt: jwtInstance,
        set,
      });
      if (!authResult.payload) return authResult;

      try {
        const { moodleSession, sesskey } = authResult.payload;

        if (!sesskey) {
          return {
            success: false,
            error: "Authentication required",
            message: "No sesskey found",
          };
        }

        const cacheKey = cache.userKey(moodleSession, "courses");

        const { data, etag, cached } = await cache.withCache(
          cacheKey,
          async () => {
            myCourses.defaults.headers.Cookie = `MoodleSession=${moodleSession}`;

            const response = await myCourses.post(
              `/lib/ajax/service.php?sesskey=${sesskey}`,
              [
                {
                  index: 0,
                  methodname:
                    "core_course_get_enrolled_courses_by_timeline_classification",
                  args: {
                    offset: 0,
                    limit: 0,
                    classification: "all",
                    sort: "fullname",
                    customfieldname: "",
                    customfieldvalue: "",
                  },
                },
              ],
              { headers: { "Content-Type": "application/json" } },
            );

            if (response.status === 302) {
              throw new Error("Session expired");
            }

            const data = response.data;
            if (!Array.isArray(data) || !data[0] || data[0].error) {
              throw new Error(data[0]?.error || "Failed to fetch courses");
            }

            const coursesData = data[0].data;
            const decodedCourses = coursesData.courses.map(
              (course: {
                fullname?: string;
                shortname?: string;
                summary?: string;
                coursecategory?: string;
                fullnamedisplay?: string;
                [key: string]: unknown;
              }) => ({
                ...course,
                fullname: decodeHtmlEntities(course.fullname || ""),
                shortname: decodeHtmlEntities(course.shortname || ""),
                summary: decodeHtmlEntities(course.summary || ""),
                coursecategory: decodeHtmlEntities(course.coursecategory || ""),
                fullnamedisplay: decodeHtmlEntities(
                  course.fullnamedisplay || "",
                ),
              }),
            );

            return {
              success: true,
              courses: decodedCourses,
              nextoffset: coursesData.nextoffset,
            };
          },
          CACHE_TTL.VERY_LONG,
        );

        setCacheHeaders(set, CACHE_TTL.VERY_LONG, etag, cached);
        return data;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Course fetch failed",
          message: "Failed to fetch courses",
        };
      }
    },
    {
      response: CourseResponse,
      detail: { summary: "Get enrolled courses", tags: ["user"] },
    },
  )

  // Attendance endpoints
  .get(
    "/attendance/:courseId",
    async ({ params, headers, jwt: jwtInstance, set }) => {
      const authResult = await authMiddleware({
        headers,
        jwt: jwtInstance,
        set,
      });
      if (!authResult.payload) return authResult;

      try {
        const { courseId } = params;
        const { moodleSession } = authResult.payload;
        const cacheKey = cache.courseKey(moodleSession, courseId, "attendance");

        const { data, etag, cached } = await cache.withCache(
          cacheKey,
          async () => {
            myCourses.defaults.headers.Cookie = `MoodleSession=${moodleSession}`;
            const response = await myCourses.get(
              `/course/attendance.php?id=${courseId}`,
            );

            if (response.status === 302) {
              throw new Error("Session expired");
            }

            return {
              success: true,
              attendance: extractAbsentRecords(response.data),
            };
          },
          CACHE_TTL.MEDIUM,
        );

        setCacheHeaders(set, CACHE_TTL.MEDIUM, etag, cached);
        return data;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Attendance fetch failed",
          message: "Failed to fetch attendance",
        };
      }
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
      response: AttendanceResponse,
      detail: { summary: "Get course attendance", tags: ["attendance"] },
    },
  )

  // Course content endpoints
  .get(
    "/course/:courseId/content",
    async ({ params, headers, jwt: jwtInstance, set }) => {
      const authResult = await authMiddleware({
        headers,
        jwt: jwtInstance,
        set,
      });
      if (!authResult.payload) return authResult;

      try {
        const { courseId } = params;
        const { moodleSession } = authResult.payload;
        const cacheKey = cache.courseKey(moodleSession, courseId, "content");

        const { data, etag, cached } = await cache.withCache(
          cacheKey,
          async () => {
            myCourses.defaults.headers.Cookie = `MoodleSession=${moodleSession}`;
            const response = await myCourses.get(
              `/course/view.php?id=${courseId}`,
            );

            if (response.status === 302) {
              throw new Error("Session expired");
            }

            const courseContent = extractCourseContent(response.data);
            if (!courseContent) {
              throw new Error("Failed to parse course content");
            }

            // Extract AI level information if available
            const aiLevel = extractAILevel(response.data);
            if (aiLevel) {
              courseContent.aiLevel = aiLevel;
            }

            return {
              success: true,
              content: courseContent,
            };
          },
          CACHE_TTL.MEDIUM,
        );

        setCacheHeaders(set, CACHE_TTL.MEDIUM, etag, cached);
        return data;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Course content fetch failed",
          message: "Failed to fetch course content",
        };
      }
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
      response: CourseContentResponse,
      detail: { summary: "Get course content and structure", tags: ["course"] },
    },
  )

  // Course syllabus endpoint
  .get(
    "/course/:courseId/syllabus",
    async ({ params, headers, jwt: jwtInstance, set }) => {
      const authResult = await authMiddleware({
        headers,
        jwt: jwtInstance,
        set,
      });
      if (!authResult.payload) return authResult;

      try {
        const { courseId } = params;
        const { moodleSession } = authResult.payload;
        const cacheKey = cache.courseKey(moodleSession, courseId, "syllabus");

        const { data, etag, cached } = await cache.withCache(
          cacheKey,
          async () => {
            myCourses.defaults.headers.Cookie = `MoodleSession=${moodleSession}`;
            const response = await myCourses.get(
              `/course/view.php?id=${courseId}`,
            );

            if (response.status === 302) {
              throw new Error("Session expired");
            }

            const courseContent = extractCourseContent(response.data);
            if (!courseContent) {
              throw new Error("Failed to parse course content");
            }

            // Find the Course Syllabus section
            const syllabusSection = courseContent.sections.find(
              (section) => section.name === "Course Syllabus",
            );

            if (!syllabusSection || !syllabusSection.syllabusData) {
              return {
                success: true,
                courseInfo: {
                  id: courseContent.courseId,
                  name: courseContent.courseName,
                  attendance: courseContent.attendanceInfo,
                  aiLevel: courseContent.aiLevel,
                },
                outline: [],
                message: "No syllabus data found for this course",
              };
            }

            // Process syllabus data for frontend
            interface LectureGroup {
              lectureNumber: string | null;
              type: "lecture" | "exam" | "content";
              topics: { title: string; subtopics: string[] }[];
              quizzes: string[];
              materials: { name: string; url: string; type: string }[];
              labExercises: { name: string; url: string; type: string }[];
              rawDescription: string;
              rawMaterials: string;
              rawLabExercises: string;
              isSpecialRow: boolean;
            }
            const lectureGroups: Record<string, LectureGroup[]> = {};
            syllabusSection.syllabusData.forEach((row) => {
              const key = row.lectureNumber || "special";
              if (!lectureGroups[key]) lectureGroups[key] = [];
              lectureGroups[key].push(row);
            });

            type LectureOutlineItem = {
              type: "lecture";
              lectureNumber: number;
              title: string;
              topics: { title: string; subtopics: string[] }[];
              quizzes: string[];
              materials: { name: string; url: string; type: string }[];
              labExercises: { name: string; url: string; type: string }[];
              isSpecial: boolean;
            };

            type ExamOutlineItem = {
              type: "exam";
              title: string;
              materials: { name: string; url: string; type: string }[];
              isSpecial: boolean;
            };

            type OutlineItem = LectureOutlineItem | ExamOutlineItem;
            const outline: OutlineItem[] = [];

            // Sort and process groups
            Object.keys(lectureGroups)
              .sort((a, b) => {
                if (a === "special") return 1;
                if (b === "special") return -1;
                return parseInt(a, 10) - parseInt(b, 10);
              })
              .forEach((lectureKey) => {
                const rows = lectureGroups[lectureKey];

                if (lectureKey === "special") {
                  // Handle special sessions (midterm, final)
                  rows.forEach((row) => {
                    if (row.type === "exam") {
                      outline.push({
                        type: "exam",
                        title: row.rawDescription.trim(),
                        materials: row.materials,
                        isSpecial: true,
                      });
                    }
                  });
                } else {
                  // Handle regular lectures
                  const lectureEntry: LectureOutlineItem = {
                    type: "lecture",
                    lectureNumber: parseInt(lectureKey, 10),
                    title: `Lecture ${lectureKey}`,
                    topics: [],
                    quizzes: [],
                    materials: [],
                    labExercises: [],
                    isSpecial: false,
                  };

                  rows.forEach((row) => {
                    lectureEntry.topics.push(...row.topics);
                    lectureEntry.quizzes.push(...row.quizzes);
                    lectureEntry.materials.push(...row.materials);
                    lectureEntry.labExercises.push(...row.labExercises);
                  });

                  // Set the main title from the first topic
                  if (lectureEntry.topics.length > 0) {
                    lectureEntry.title = `Lecture ${lectureKey}: ${lectureEntry.topics[0].title}`;
                  }

                  outline.push(lectureEntry);
                }
              });

            return {
              success: true,
              courseInfo: {
                id: courseContent.courseId,
                name: courseContent.courseName,
                attendance: courseContent.attendanceInfo,
                aiLevel: courseContent.aiLevel,
              },
              outline,
            };
          },
          CACHE_TTL.LONG,
        );

        setCacheHeaders(set, CACHE_TTL.LONG, etag, cached);
        return data;
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Course syllabus fetch failed",
          message: "Failed to fetch course syllabus",
        };
      }
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        courseInfo: t.Optional(
          t.Object({
            id: t.String(),
            name: t.String(),
            attendance: t.Optional(
              t.Object({
                current: t.Number(),
                total: t.Number(),
                percentage: t.Number(),
              }),
            ),
            aiLevel: t.Optional(
              t.Object({
                level: t.Number(),
                description: t.String(),
                color: t.String(),
              }),
            ),
          }),
        ),
        outline: t.Optional(
          t.Array(
            t.Union([
              t.Object({
                type: t.Literal("lecture"),
                lectureNumber: t.Number(),
                title: t.String(),
                topics: t.Array(
                  t.Object({
                    title: t.String(),
                    subtopics: t.Array(t.String()),
                  }),
                ),
                quizzes: t.Array(t.String()),
                materials: t.Array(
                  t.Object({
                    name: t.String(),
                    url: t.String(),
                    type: t.String(),
                  }),
                ),
                labExercises: t.Array(
                  t.Object({
                    name: t.String(),
                    url: t.String(),
                    type: t.String(),
                  }),
                ),
                isSpecial: t.Boolean(),
              }),
              t.Object({
                type: t.Literal("exam"),
                title: t.String(),
                materials: t.Array(
                  t.Object({
                    name: t.String(),
                    url: t.String(),
                    type: t.String(),
                  }),
                ),
                isSpecial: t.Boolean(),
              }),
            ]),
          ),
        ),
        message: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
      detail: { summary: "Get course syllabus structure", tags: ["course"] },
    },
  );

export type App = typeof app;
export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;
export const OPTIONS = app.handle;

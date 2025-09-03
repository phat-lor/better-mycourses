import { parse, serialize } from "cookie";

/**
 * Create a secure cookie string
 */
export const createCookie = (name: string, value: string, maxAge = 3600) => {
  return serialize(name, value, {
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

/**
 * Create a cookie string that clears the cookie
 */
export const clearCookie = (name: string) => {
  return serialize(name, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
};

/**
 * Parse cookie header into an object
 */
export const getCookies = (cookieHeader?: string) => {
  return cookieHeader ? parse(cookieHeader) : {};
};

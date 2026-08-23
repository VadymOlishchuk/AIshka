import type { NextResponse } from "next/server";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "./tokens";

export const ACCESS_COOKIE = "at";
export const REFRESH_COOKIE = "rt";

// HttpOnly — щоб токен не читався зі сторонніх скриптів на сторінці.
const BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(res: NextResponse, access: string, refresh: string) {
  res.cookies.set(ACCESS_COOKIE, access, { ...BASE, maxAge: ACCESS_TTL_SECONDS });
  res.cookies.set(REFRESH_COOKIE, refresh, { ...BASE, maxAge: REFRESH_TTL_SECONDS });
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...BASE, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...BASE, maxAge: 0 });
  return res;
}

import { env } from "../env";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "./tokens";

export const ACCESS_COOKIE = "at";
export const REFRESH_COOKIE = "rt";

export type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
  domain?: string;
};

// HttpOnly — щоб токен не читався зі сторонніх скриптів на сторінці.
// secure лише на проді: локально трафік іде по http.
function base(): Omit<CookieOptions, "maxAge"> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

/** Опції для пари auth-cookie. Ставить їх той, хто тримає відповідь. */
export function authCookies(access: string, refresh: string) {
  return [
    { name: ACCESS_COOKIE, value: access, options: { ...base(), maxAge: ACCESS_TTL_SECONDS } },
    { name: REFRESH_COOKIE, value: refresh, options: { ...base(), maxAge: REFRESH_TTL_SECONDS } },
  ] as const;
}

export function clearedAuthCookies() {
  return [
    { name: ACCESS_COOKIE, value: "", options: { ...base(), maxAge: 0 } },
    { name: REFRESH_COOKIE, value: "", options: { ...base(), maxAge: 0 } },
  ] as const;
}

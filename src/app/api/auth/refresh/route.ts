import { NextResponse, type NextRequest } from "next/server";
import { ok, toResponse } from "@/core/http/envelope";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "@/core/auth/cookies";
import { ctxOf, safeNextPath } from "@/core/http/request";
import { rotateSession } from "@/core/auth/session";

/**
 * GET — сюди веде middleware, коли access-токен протух, а refresh ще живий.
 * Middleware працює на edge і не має доступу до БД, тому ротація живе тут.
 */
export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh) return redirectToLogin(req, next);

  try {
    const rotated = await rotateSession(refresh, ctxOf(req));
    const res = NextResponse.redirect(new URL(next, req.nextUrl.origin));
    return setAuthCookies(res, rotated.access, rotated.refresh);
  } catch {
    return redirectToLogin(req, next);
  }
}

/** POST — для клієнтських запитів, які отримали 401. */
export async function POST(req: NextRequest) {
  try {
    const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
    if (!refresh) return clearAuthCookies(NextResponse.json({ ok: false }, { status: 401 }));

    const rotated = await rotateSession(refresh, ctxOf(req));
    return setAuthCookies(ok({ refreshed: true }), rotated.access, rotated.refresh);
  } catch (error) {
    return toResponse(error);
  }
}

function redirectToLogin(req: NextRequest, next: string) {
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("next", next);
  return clearAuthCookies(NextResponse.redirect(url));
}

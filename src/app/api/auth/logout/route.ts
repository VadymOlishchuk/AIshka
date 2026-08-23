import type { NextRequest } from "next/server";
import { ok, toResponse } from "@/core/http/envelope";
import { clearAuthCookies, REFRESH_COOKIE } from "@/core/auth/cookies";
import { revokeByRefresh } from "@/core/auth/session";

export async function POST(req: NextRequest) {
  try {
    const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
    if (refresh) await revokeByRefresh(refresh);
    return clearAuthCookies(ok({ next: "/login" }));
  } catch (error) {
    return toResponse(error);
  }
}

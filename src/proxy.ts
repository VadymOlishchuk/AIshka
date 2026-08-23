import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Рівень 1 доступу: вирішує лише, куди вести людину.
 * Авторитетна перевірка — requireActiveAccess() у кожному обробнику й
 * серверному компоненті: сюди не приходить інформація про те, який саме
 * ресурс запитали, тому захищати контент тут неможливо.
 */
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? "");

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get("at")?.value;

  if (token) {
    try {
      await jwtVerify(token, secret, { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      // access протух — падаємо нижче, у гілку оновлення
    }
  }

  const next = `${pathname}${search}`;

  // Access протух, але refresh ще живий: ротація вимагає БД і живе в обробнику.
  if (req.cookies.get("rt")?.value) {
    const url = new URL("/api/auth/refresh", req.nextUrl.origin);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const login = new URL("/login", req.nextUrl.origin);
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};

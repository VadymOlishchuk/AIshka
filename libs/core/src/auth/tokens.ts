import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../env";

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

// Хто видав і для кого: коли з'явиться другий сервіс на тому ж секреті,
// його токени не підійдуть сюди, а наші — туди.
const ISSUER = "aishka";
const AUDIENCE = "aishka-api";

export const ACCESS_TTL_SECONDS = 15 * 60; // 15 хвилин
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 днів

export type AccessClaims = { sub: string; sid: string };

export async function signAccess(claims: AccessClaims): Promise<string> {
  return new SignJWT({ sid: claims.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccess(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    return { sub: payload.sub, sid: payload.sid };
  } catch {
    return null;
  }
}

/** Refresh-токен непрозорий: у БД лежить лише його sha256. */
export function newOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

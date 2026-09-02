import type { FastifyReply, FastifyRequest } from "fastify";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookies,
  clearedAuthCookies,
} from "@aishka/core/auth/cookies";
import { currentUser, requireActiveAccess, requireUser } from "@aishka/core/auth/guards";
import { ctxOf } from "@aishka/core/http/request";

/** Токен з cookie. Заголовок Authorization тут навмисно не читається: один канал — менше дір. */
export const accessToken = (req: FastifyRequest) => req.cookies[ACCESS_COOKIE] ?? null;
export const refreshToken = (req: FastifyRequest) => req.cookies[REFRESH_COOKIE] ?? null;

export const userOf = (req: FastifyRequest) => currentUser(accessToken(req));
export const requireUserOf = (req: FastifyRequest) => requireUser(accessToken(req));
export const requireAccessOf = (req: FastifyRequest) => requireActiveAccess(accessToken(req));

// req.ip уже враховує trustProxy — читати X-Forwarded-For руками не можна.
export const requestCtx = (req: FastifyRequest) => ctxOf(req.ip, req.headers);
export const requestIp = (req: FastifyRequest) => req.ip;

export function setAuthCookies(reply: FastifyReply, access: string, refresh: string) {
  for (const c of authCookies(access, refresh)) reply.setCookie(c.name, c.value, c.options);
  return reply;
}

export function clearAuthCookies(reply: FastifyReply) {
  for (const c of clearedAuthCookies()) reply.setCookie(c.name, c.value, c.options);
  return reply;
}

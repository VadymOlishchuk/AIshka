import fp from "fastify-plugin";
import type { FastifyReply } from "fastify";
import { STATUS, errorBody, okBody, type ErrorCode } from "@aishka/core/http/errors";

declare module "fastify" {
  interface FastifyReply {
    ok<T>(data: T): FastifyReply;
    fail(
      code: ErrorCode,
      options?: { message?: string; fields?: Record<string, string>; headers?: Record<string, string> },
    ): FastifyReply;
  }
}

/** reply.ok(data) / reply.fail(code) — щоб жоден обробник не збирав конверт руками. */
export const envelope = fp(async (app) => {
  app.decorateReply("ok", function (this: FastifyReply, data: unknown) {
    return this.status(200).send(okBody(data));
  });
  app.decorateReply("fail", function (this: FastifyReply, code: ErrorCode, options) {
    if (options?.headers) this.headers(options.headers);
    return this.status(STATUS[code]).send(errorBody(code, options));
  });
});

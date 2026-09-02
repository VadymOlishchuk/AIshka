import "dotenv/config";
import { env } from "@aishka/core/env";
import { buildApp } from "./app";

const app = await buildApp();

try {
  await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

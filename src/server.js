import { createApp } from "./app.js";
import { assertServerEnv, env } from "./config/env.js";
import { closeDatabase, connectDatabase } from "./db/mongo.js";

let server;
let shuttingDown = false;

async function start() {
  assertServerEnv();
  await connectDatabase();

  const app = createApp();
  server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`Story Hub API listening on http://0.0.0.0:${env.port}`);
  });

  server.on("error", (error) => {
    console.error("HTTP server error:", error.message);
    process.exitCode = 1;
  });
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received. Shutting down...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await closeDatabase();
}

process.on("SIGINT", () => shutdown("SIGINT").finally(() => process.exit(0)));
process.on("SIGTERM", () => shutdown("SIGTERM").finally(() => process.exit(0)));

start().catch((error) => {
  console.error("Backend failed to start:", error.message);
  process.exit(1);
});

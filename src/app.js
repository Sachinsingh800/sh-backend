import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { getDatabase } from "./db/mongo.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { communityRouter } from "./routes/community.routes.js";
import { mediaRouter } from "./routes/media.routes.js";
import { storyRouter } from "./routes/story.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          env.corsOrigins.includes("*") ||
          env.corsOrigins.includes(origin)
        ) {
          return callback(null, true);
        }
        const error = new Error("Origin is not allowed by CORS.");
        error.status = 403;
        callback(error);
      },
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.get("/api/health", async (req, res) => {
    await getDatabase().command({ ping: 1 });
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  });
  app.use("/api/community", communityRouter);
  app.use("/api/stories", storyRouter);
  app.use("/api/media", mediaRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

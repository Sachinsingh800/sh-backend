import { env } from "../config/env.js";

export function requireAdmin(req, res, next) {
  if (!env.adminApiKey) {
    return res.status(503).json({
      error: "Admin API is disabled until ADMIN_API_KEY is configured.",
    });
  }

  const supplied = req.get("x-admin-key");
  if (supplied !== env.adminApiKey) {
    return res.status(401).json({ error: "Invalid admin API key." });
  }
  next();
}

import "dotenv/config";

function text(name, fallback = "") {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function number(name, fallback) {
  const value = Number.parseInt(text(name), 10);
  return Number.isFinite(value) ? value : fallback;
}

export const env = Object.freeze({
  nodeEnv: text("NODE_ENV", "development"),
  port: number("PORT", 4000),
  mongoUri: text("MONGODB_URI"),
  mongoDbName: text("MONGODB_DB_NAME", "story_hub"),
  corsOrigins: text("CORS_ORIGINS", "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminApiKey: text("ADMIN_API_KEY"),
  imagekitUrlEndpoint: text(
    "IMAGEKIT_URL_ENDPOINT",
    "https://ik.imagekit.io/vydsyx8gx",
  ),
  imagekitPublicKey: text("IMAGEKIT_PUBLIC_KEY"),
  imagekitPrivateKey: text("IMAGEKIT_PRIVATE_KEY"),
});

export function assertServerEnv() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is required. Copy .env.example to .env and add it.");
  }
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertServerEnv, env } from "../src/config/env.js";
import { closeDatabase, connectDatabase } from "../src/db/mongo.js";
import { uploadBuffer } from "../src/services/imagekit.service.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoot = path.resolve(backendRoot, env.localMediaRoot);
const dryRun = process.argv.includes("--dry-run");
const uploadCache = new Map();

async function migrateValue(value) {
  if (typeof value === "string" && value.startsWith("/media/")) {
    if (uploadCache.has(value)) return uploadCache.get(value);
    const relative = value.slice("/media/".length);
    const localPath = path.resolve(mediaRoot, relative);
    if (!localPath.startsWith(`${mediaRoot}${path.sep}`) || !fs.existsSync(localPath)) {
      throw new Error(`Local media file not found: ${localPath}`);
    }
    if (dryRun) {
      console.log(`[dry-run] ${relative}`);
      return value;
    }
    const folder = `/story-hub/${path.dirname(relative).split(path.sep).join("/")}`;
    const result = await uploadBuffer(
      fs.readFileSync(localPath),
      path.basename(localPath),
      folder,
    );
    uploadCache.set(value, result.url);
    console.log(`Uploaded ${relative}`);
    return result.url;
  }
  if (Array.isArray(value)) return Promise.all(value.map(migrateValue));
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, child]) => [key, await migrateValue(child)]),
    );
    return Object.fromEntries(entries);
  }
  return value;
}

async function uploadAll() {
  assertServerEnv();
  if (!env.imagekitPrivateKey && !dryRun) {
    throw new Error("Add IMAGEKIT_PRIVATE_KEY to backend/.env before uploading.");
  }
  const db = await connectDatabase();
  const stories = await db.collection("stories").find({}).toArray();
  for (const story of stories) {
    const migrated = await migrateValue(story);
    if (!dryRun) {
      delete migrated._id;
      await db.collection("stories").updateOne(
        { _id: story._id },
        { $set: { ...migrated, updatedAt: new Date() } },
      );
    }
  }
  console.log(
    dryRun
      ? `Validated local media for ${stories.length} stories.`
      : `Migrated media for ${stories.length} stories to ImageKit.`,
  );
}

uploadAll()
  .catch((error) => {
    console.error("Media migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);

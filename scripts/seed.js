import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertServerEnv } from "../src/config/env.js";
import { closeDatabase, connectDatabase } from "../src/db/mongo.js";
import { replaceAllStories } from "../src/repositories/story.repository.js";
import { validateStory } from "../src/services/story-validation.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedFile = path.join(backendRoot, "src", "data", "stories.json");

async function seed() {
  assertServerEnv();
  const stories = JSON.parse(fs.readFileSync(seedFile, "utf8")).map(validateStory);
  await connectDatabase();
  const count = await replaceAllStories(stories);
  console.log(`Seeded ${count} stories into MongoDB.`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);

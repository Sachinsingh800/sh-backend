import { MongoClient, ServerApiVersion } from "mongodb";
import { env } from "../config/env.js";
import { resolveMongoUri } from "./resolve-mongo-uri.js";

let client;
let database;

export async function connectDatabase() {
  if (database) return database;

  const mongoUri = await resolveMongoUri(env.mongoUri);
  client = new MongoClient(mongoUri, {
    maxPoolSize: 20,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 15_000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });
  await client.connect();
  database = client.db(env.mongoDbName);
  await database.command({ ping: 1 });
  await ensureIndexes(database);
  return database;
}

async function ensureIndexes(db) {
  const stories = db.collection("stories");
  const reviews = db.collection("reviews");
  const indexes = await stories.indexes().catch(() => []);
  const legacySearchIndex = indexes.find(
    (index) => index.name === "title_text_author_text_tags_text_genre_text",
  );
  if (legacySearchIndex) {
    await stories.dropIndex(legacySearchIndex.name);
  }

  await Promise.all([
    stories.createIndex({ id: 1 }, { unique: true }),
    stories.createIndex(
      { title: "text", author: "text", tags: "text", genre: "text" },
      {
        name: "story_search",
        default_language: "none",
        language_override: "textSearchLanguage",
      },
    ),
    stories.createIndex({ featured: 1, publishedAt: -1 }),
    stories.createIndex({ category: 1, language: 1 }),
    reviews.createIndex(
      { storyId: 1, uid: 1 },
      { unique: true, name: "one_review_per_reader" },
    ),
    reviews.createIndex(
      { storyId: 1, updatedAt: -1 },
      { name: "story_reviews_recent" },
    ),
  ]);
}

export function getDatabase() {
  if (!database) throw new Error("Database has not been connected.");
  return database;
}

export async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
}

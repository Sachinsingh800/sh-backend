import { getDatabase } from "../db/mongo.js";

function collection() {
  return getDatabase().collection("stories");
}

function publicStory(document) {
  if (!document) return null;
  const { _id, ...story } = document;
  return story;
}

export async function listStories(filters = {}) {
  const query = {};
  if (filters.featured !== undefined) query.featured = filters.featured;
  if (filters.category) query.category = filters.category;
  if (filters.language) query.language = filters.language;
  if (filters.genre) query.genre = filters.genre;
  if (filters.search) query.$text = { $search: filters.search };

  const documents = await collection()
    .find(query)
    .sort(filters.search ? { score: { $meta: "textScore" } } : { order: 1, createdAt: 1 })
    .toArray();
  return documents.map(publicStory);
}

export async function findStory(id) {
  return publicStory(await collection().findOne({ id }));
}

export async function createStory(story) {
  const now = new Date();
  const document = { ...story, createdAt: now, updatedAt: now };
  await collection().insertOne(document);
  return publicStory(document);
}

export async function replaceStory(id, story) {
  const document = { ...story, id, updatedAt: new Date() };
  const result = await collection().findOneAndUpdate(
    { id },
    { $set: document, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: "after" },
  );
  return publicStory(result);
}

export async function removeStory(id) {
  return (await collection().deleteOne({ id })).deletedCount === 1;
}

export async function replaceAllStories(stories) {
  const operations = stories.map((story, order) => ({
    updateOne: {
      filter: { id: story.id },
      update: {
        $set: { ...story, order, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      upsert: true,
    },
  }));
  if (operations.length) await collection().bulkWrite(operations);
  return operations.length;
}

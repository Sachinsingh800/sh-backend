import { createHash } from "node:crypto";
import { getDatabase } from "../db/mongo.js";

const MAX_PUBLIC_COMMENTS = 100;

function collection() {
  return getDatabase().collection("reviews");
}

function timestamp(value) {
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function publicReaderId(storyId, uid) {
  return `reader_${createHash("sha256")
    .update(`${storyId}\0${uid}`)
    .digest("base64url")
    .slice(0, 24)}`;
}

function publicReview(document, viewerUid) {
  if (!document) return null;
  return {
    uid:
      viewerUid && document.uid === viewerUid
        ? document.uid
        : publicReaderId(document.storyId, document.uid),
    rating: document.rating,
    comment: typeof document.comment === "string" ? document.comment : "",
    authorName: document.authorName || "Story Hub reader",
    authorPhoto: document.authorPhoto || "",
    updatedAt: timestamp(document.updatedAt),
  };
}

async function storySummary(storyId) {
  const [summary] = await collection()
    .aggregate([
      { $match: { storyId } },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, average: 1, count: 1 } },
    ])
    .toArray();
  return summary || { average: 0, count: 0 };
}

export async function getStoryCommunity(storyId, viewerUid) {
  const [comments, ownReview, summary] = await Promise.all([
    collection()
      .find({ storyId, comment: { $type: "string", $ne: "" } })
      .sort({ updatedAt: -1 })
      .limit(MAX_PUBLIC_COMMENTS)
      .toArray(),
    viewerUid ? collection().findOne({ storyId, uid: viewerUid }) : null,
    storySummary(storyId),
  ]);
  const documents = ownReview && !comments.some((item) => item.uid === viewerUid)
    ? [ownReview, ...comments]
    : comments;
  return {
    reviews: documents.map((document) => publicReview(document, viewerUid)),
    summary,
  };
}

export async function listReviewSummaries(storyIds) {
  if (!storyIds.length) return {};
  const summaries = await collection()
    .aggregate([
      { $match: { storyId: { $in: storyIds } } },
      {
        $group: {
          _id: "$storyId",
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
  const byStory = Object.fromEntries(
    summaries.map((summary) => [
      summary._id,
      { average: summary.average, count: summary.count },
    ]),
  );
  return Object.fromEntries(
    storyIds.map((storyId) => [
      storyId,
      byStory[storyId] || { average: 0, count: 0 },
    ]),
  );
}

export async function upsertReview({ storyId, rating, comment, user }) {
  const now = new Date();
  const fields = {
    rating,
    authorName: user.name,
    authorPhoto: user.picture,
    updatedAt: now,
  };
  if (comment !== undefined) fields.comment = comment;

  let document;
  try {
    document = await collection().findOneAndUpdate(
      { storyId, uid: user.uid },
      {
        $set: fields,
        $setOnInsert: { storyId, uid: user.uid, createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    document = await collection().findOneAndUpdate(
      { storyId, uid: user.uid },
      { $set: fields },
      { returnDocument: "after" },
    );
    if (!document) throw error;
  }
  return publicReview(document, user.uid);
}

export async function clearReviewComment({ storyId, user }) {
  const document = await collection().findOneAndUpdate(
    { storyId, uid: user.uid },
    {
      $set: {
        comment: "",
        authorName: user.name,
        authorPhoto: user.picture,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  return publicReview(document, user.uid);
}

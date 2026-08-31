import { Router } from "express";
import {
  optionalFirebaseUser,
  requireFirebaseUser,
} from "../middleware/firebase-auth.js";
import {
  clearReviewComment,
  getStoryCommunity,
  listReviewSummaries,
  upsertReview,
} from "../repositories/review.repository.js";
import { findStory } from "../repositories/story.repository.js";
import {
  validateReviewInput,
  validateStoryId,
  validateStoryIds,
} from "../services/review-validation.js";

export const communityRouter = Router();

async function requireStory(storyId, res) {
  const story = await findStory(storyId);
  if (!story) {
    res.status(404).json({
      code: "review/story-not-found",
      error: "Story not found.",
    });
    return false;
  }
  return true;
}

communityRouter.get("/stories/:storyId", optionalFirebaseUser, async (req, res) => {
  const storyId = validateStoryId(req.params.storyId);
  if (!(await requireStory(storyId, res))) return;
  res.set("Cache-Control", "no-store");
  res.json({
    data: await getStoryCommunity(storyId, req.communityUser?.uid),
  });
});

communityRouter.post("/summaries", async (req, res) => {
  const storyIds = validateStoryIds(req.body);
  res.set("Cache-Control", "no-store");
  res.json({ data: await listReviewSummaries(storyIds) });
});

communityRouter.put(
  "/stories/:storyId/me",
  requireFirebaseUser,
  async (req, res) => {
    const storyId = validateStoryId(req.params.storyId);
    if (!(await requireStory(storyId, res))) return;
    const input = validateReviewInput(req.body);
    await upsertReview({ storyId, ...input, user: req.communityUser });
    res.set("Cache-Control", "no-store");
    res.json({
      data: await getStoryCommunity(storyId, req.communityUser.uid),
    });
  },
);

communityRouter.delete(
  "/stories/:storyId/me/comment",
  requireFirebaseUser,
  async (req, res) => {
    const storyId = validateStoryId(req.params.storyId);
    if (!(await requireStory(storyId, res))) return;
    const review = await clearReviewComment({
      storyId,
      user: req.communityUser,
    });
    if (!review) {
      return res.status(404).json({
        code: "review/not-found",
        error: "Rate this story before deleting a comment.",
      });
    }
    res.set("Cache-Control", "no-store");
    res.json({
      data: await getStoryCommunity(storyId, req.communityUser.uid),
    });
  },
);

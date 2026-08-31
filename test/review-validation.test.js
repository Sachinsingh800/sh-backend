import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_COMMENT_LENGTH,
  validateReviewInput,
  validateStoryId,
  validateStoryIds,
} from "../src/services/review-validation.js";

test("normalizes a valid rating and comment", () => {
  assert.deepEqual(validateReviewInput({ rating: 5, comment: "  Beautiful.  " }), {
    rating: 5,
    comment: "Beautiful.",
  });
});

test("accepts rating-only updates", () => {
  assert.deepEqual(validateReviewInput({ rating: 3 }), { rating: 3 });
});

test("rejects invalid ratings and comments", () => {
  assert.throws(() => validateReviewInput({ rating: 0 }), /integer from 1 to 5/);
  assert.throws(() => validateReviewInput({ rating: 4.5 }), /integer from 1 to 5/);
  assert.throws(() => validateReviewInput({ rating: 4, comment: "   " }), /cannot be empty/);
  assert.throws(
    () => validateReviewInput({ rating: 4, comment: "x".repeat(MAX_COMMENT_LENGTH + 1) }),
    /cannot exceed/,
  );
});

test("validates and deduplicates story ids", () => {
  assert.equal(validateStoryId("  story-1 "), "story-1");
  assert.deepEqual(
    validateStoryIds({ storyIds: ["story-1", "story-2", "story-1"] }),
    ["story-1", "story-2"],
  );
});

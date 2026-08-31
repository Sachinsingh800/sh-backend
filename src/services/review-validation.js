export const MAX_COMMENT_LENGTH = 500;
export const MAX_SUMMARY_STORIES = 100;

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  error.code = "review/invalid-input";
  throw error;
}

export function validateStoryId(value) {
  if (typeof value !== "string") invalid("storyId must be a string.");
  const storyId = value.trim();
  if (!storyId || storyId.length > 100) invalid("storyId is invalid.");
  return storyId;
}

export function validateReviewInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid("Review payload must be an object.");
  }

  const rating = Number(value.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    invalid("rating must be an integer from 1 to 5.");
  }

  const result = { rating };
  if (Object.hasOwn(value, "comment")) {
    if (typeof value.comment !== "string") invalid("comment must be a string.");
    const comment = value.comment.trim();
    if (!comment) invalid("comment cannot be empty.");
    if (comment.length > MAX_COMMENT_LENGTH) {
      invalid(`comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
    }
    result.comment = comment;
  }
  return result;
}

export function validateStoryIds(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.storyIds)) {
    invalid("storyIds must be an array.");
  }
  if (value.storyIds.length > MAX_SUMMARY_STORIES) {
    invalid(`storyIds cannot contain more than ${MAX_SUMMARY_STORIES} items.`);
  }
  return [...new Set(value.storyIds.map(validateStoryId))];
}

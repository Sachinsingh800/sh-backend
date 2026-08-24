function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function cleanString(value, field, { required = true, max = 10_000 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) invalid(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== "string") invalid(`${field} must be a string.`);
  const cleaned = value.trim();
  if (!cleaned && required) invalid(`${field} is required.`);
  if (cleaned.length > max) invalid(`${field} is too long.`);
  return cleaned || undefined;
}

function stringArray(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    invalid(`${field} must be an array of strings.`);
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}

function media(value, field, required = false) {
  return cleanString(value, field, { required, max: 2_000 });
}

function page(value, index) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid(`pages[${index}] must be an object.`);
  }
  return {
    id: cleanString(value.id, `pages[${index}].id`, { max: 100 }),
    title: cleanString(value.title, `pages[${index}].title`, {
      required: false,
      max: 200,
    }),
    body: cleanString(value.body, `pages[${index}].body`, { max: 100_000 }),
    after: cleanString(value.after, `pages[${index}].after`, {
      required: false,
      max: 100_000,
    }),
    image: media(value.image, `pages[${index}].image`),
    audio: media(value.audio, `pages[${index}].audio`),
  };
}

export function validateStory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid("Story payload must be an object.");
  }
  if (!Array.isArray(value.pages) || value.pages.length === 0) {
    invalid("pages must contain at least one story page.");
  }

  return {
    id: cleanString(value.id, "id", { max: 100 }),
    title: cleanString(value.title, "title", { max: 250 }),
    thumbnail: media(value.thumbnail, "thumbnail", true),
    ambient: media(value.ambient, "ambient"),
    author: cleanString(value.author, "author", { max: 200 }),
    authorBio: cleanString(value.authorBio, "authorBio", {
      required: false,
      max: 5_000,
    }),
    publishedDate: cleanString(value.publishedDate, "publishedDate", {
      max: 100,
    }),
    readingTime: cleanString(value.readingTime, "readingTime", { max: 100 }),
    listeningTime: cleanString(value.listeningTime, "listeningTime", {
      required: false,
      max: 100,
    }),
    description: cleanString(value.description, "description", { max: 5_000 }),
    endNote: cleanString(value.endNote, "endNote", {
      required: false,
      max: 10_000,
    }),
    authorNote: cleanString(value.authorNote, "authorNote", {
      required: false,
      max: 10_000,
    }),
    category: cleanString(value.category, "category", { max: 150 }),
    genre: stringArray(value.genre, "genre"),
    language: cleanString(value.language, "language", { max: 100 }),
    tags: stringArray(value.tags, "tags"),
    featured: Boolean(value.featured),
    pages: value.pages.map(page),
  };
}

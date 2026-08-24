import { Router } from "express";
import { requireAdmin } from "../middleware/admin-auth.js";
import {
  createStory,
  findStory,
  listStories,
  removeStory,
  replaceStory,
} from "../repositories/story.repository.js";
import { validateStory } from "../services/story-validation.js";

export const storyRouter = Router();

storyRouter.get("/", async (req, res) => {
  const featured =
    req.query.featured === "true"
      ? true
      : req.query.featured === "false"
        ? false
        : undefined;
  const stories = await listStories({
    featured,
    category: req.query.category,
    genre: req.query.genre,
    language: req.query.language,
    search: req.query.search,
  });
  res.json({ data: stories, count: stories.length });
});

storyRouter.get("/:id", async (req, res) => {
  const story = await findStory(req.params.id);
  if (!story) return res.status(404).json({ error: "Story not found." });
  res.json({ data: story });
});

storyRouter.post("/", requireAdmin, async (req, res) => {
  const story = await createStory(validateStory(req.body));
  res.status(201).json({ data: story });
});

storyRouter.put("/:id", requireAdmin, async (req, res) => {
  const story = validateStory({ ...req.body, id: req.params.id });
  res.json({ data: await replaceStory(req.params.id, story) });
});

storyRouter.delete("/:id", requireAdmin, async (req, res) => {
  const deleted = await removeStory(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Story not found." });
  res.status(204).end();
});

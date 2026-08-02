import { z } from "zod";

export const AdapterType = z.enum(["rss", "atom", "json_feed"]);
export type AdapterType = z.infer<typeof AdapterType>;

export const PostStatus = z.enum(["new", "processed", "discarded"]);
export type PostStatus = z.infer<typeof PostStatus>;

export const Project = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
});
export type Project = z.infer<typeof Project>;

export const Feed = z.object({
  id: z.number(),
  projectId: z.number(),
  url: z.string(),
  name: z.string(),
  adapterType: AdapterType,
  active: z.boolean(),
  lastFetchedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.string(),
});
export type Feed = z.infer<typeof Feed>;

export const Post = z.object({
  id: z.number(),
  feedId: z.number(),
  guid: z.string(),
  title: z.string(),
  link: z.string(),
  summary: z.string(),
  publishedAt: z.string().nullable(),
  fetchedAt: z.string(),
  status: PostStatus,
  rawJson: z.string().nullable(),
});
export type Post = z.infer<typeof Post>;

export const CreateProject = z.object({
  name: z.string().min(1),
});
export type CreateProject = z.infer<typeof CreateProject>;

export const CreateFeed = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  adapterType: AdapterType,
});
export type CreateFeed = z.infer<typeof CreateFeed>;

export const UpdateFeed = z.object({
  active: z.boolean(),
});
export type UpdateFeed = z.infer<typeof UpdateFeed>;

export const UpdatePost = z.object({
  status: PostStatus,
});
export type UpdatePost = z.infer<typeof UpdatePost>;

export const PostQuery = z.object({
  status: PostStatus.optional(),
  since: z.string().optional(),
});
export type PostQuery = z.infer<typeof PostQuery>;

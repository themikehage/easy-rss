import type {
  CreateFeed,
  Feed,
  Post,
  PostStatus,
  PostWithFeed,
  Project,
} from "shared";

export interface FetchFeedResult {
  fetched: number;
  newPosts: number;
  lastFetchedAt: string | null;
  lastError: string | null;
  feed: Feed;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listProjects(): Promise<Project[]> {
  return request<Project[]>("/api/projects");
}

export async function createProject(name: string): Promise<Project> {
  return request<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function listFeeds(projectId: number): Promise<Feed[]> {
  return request<Feed[]>(`/api/projects/${projectId}/feeds`);
}

export async function getFeed(id: number): Promise<Feed> {
  return request<Feed>(`/api/feeds/${id}`);
}

export async function createFeed(projectId: number, input: CreateFeed): Promise<Feed> {
  return request<Feed>(`/api/projects/${projectId}/feeds`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateFeed(id: number, patch: { active: boolean }): Promise<Feed> {
  return request<Feed>(`/api/feeds/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function fetchFeed(id: number): Promise<FetchFeedResult> {
  return request<FetchFeedResult>(`/api/feeds/${id}/fetch`, {
    method: "POST",
  });
}

export async function listPosts(
  projectId: number,
  params?: { status?: PostStatus; since?: string },
): Promise<Post[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.since) query.set("since", params.since);
  const qs = query.toString();
  return request<Post[]>(`/api/projects/${projectId}/posts${qs ? `?${qs}` : ""}`);
}

export async function listFeedPosts(
  feedId: number,
  params?: { status?: PostStatus; since?: string },
): Promise<Post[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.since) query.set("since", params.since);
  const qs = query.toString();
  return request<Post[]>(`/api/feeds/${feedId}/posts${qs ? `?${qs}` : ""}`);
}

export async function getPost(id: number): Promise<PostWithFeed> {
  return request<PostWithFeed>(`/api/posts/${id}`);
}

export async function updatePostStatus(id: number, status: PostStatus): Promise<Post> {
  return request<Post>(`/api/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

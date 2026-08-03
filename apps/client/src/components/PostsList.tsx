import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Post, PostStatus } from "shared";
import { listFeedPosts, listPosts, updatePostStatus } from "../lib/api";
import { getErrorMessage } from "../lib/error";

type Filter = PostStatus | "all";

export type PostsScope =
  | { type: "project"; projectId: number }
  | { type: "feed"; feedId: number };

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Processed", value: "processed" },
  { label: "Discarded", value: "discarded" },
];

interface PostsListProps {
  scope: PostsScope;
  refreshKey: number;
}

export default function PostsList({ scope, refreshKey }: PostsListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = filter === "all" ? undefined : { status: filter };
      setPosts(
        scope.type === "project"
          ? await listPosts(scope.projectId, params)
          : await listFeedPosts(scope.feedId, params),
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setPosts(null);
    }
  }, [scope, filter]);

  useEffect(() => {
    setPosts(null);
    load();
  }, [load, refreshKey]);

  async function handleSetStatus(post: Post, status: PostStatus) {
    setPendingId(post.id);
    setError(null);
    try {
      await updatePostStatus(post.id, status);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {posts === null && !error && (
        <p className="text-sm text-muted-foreground">Loading posts…</p>
      )}
      {posts !== null && posts.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No posts yet — add a feed and hit Fetch now.
        </p>
      )}
      {posts !== null && (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <Link
                to={`/posts/${post.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {post.title}
              </Link>
              {post.publishedAt && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              )}
              {post.summary && (
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{post.summary}</p>
              )}
              <div className="mt-2">
                {post.status === "new" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pendingId === post.id}
                      onClick={() => handleSetStatus(post, "processed")}
                      className="rounded-md border border-border px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Mark processed
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === post.id}
                      onClick={() => handleSetStatus(post, "discarded")}
                      className="rounded-md border border-border px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Discard
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {post.status === "processed" ? "Processed" : "Discarded"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

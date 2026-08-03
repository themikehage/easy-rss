import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import type { PostStatus, PostWithFeed } from "shared";
import { getPost, updatePostStatus } from "../lib/api";
import { getErrorMessage } from "../lib/error";

export default function PostDetail() {
  const { postId } = useParams();
  const id = Number(postId);
  const [post, setPost] = useState<PostWithFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPost(await getPost(id));
    } catch (err) {
      setError(getErrorMessage(err));
      setPost(null);
    }
  }, [id]);

  useEffect(() => {
    setPost(null);
    load();
  }, [load]);

  async function handleSetStatus(status: PostStatus) {
    setPending(true);
    setError(null);
    try {
      await updatePostStatus(id, status);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (Number.isNaN(id)) return null;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (post === null) return <p className="text-sm text-muted-foreground">Loading post…</p>;

  const sanitized = DOMPurify.sanitize(post.summary);

  return (
    <article className="flex flex-col gap-4">
      <Link to={`/feeds/${post.feedId}`} className="text-sm text-muted-foreground hover:text-primary">
        ← {post.feedName}
      </Link>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight">{post.title}</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleString()}</span>}
          <span
            className={`rounded px-1.5 py-0.5 text-xs ${
              post.status === "new"
                ? "bg-primary text-primary-foreground"
                : post.status === "processed"
                  ? "bg-muted text-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {post.status}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {post.status === "new" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleSetStatus("processed")}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Mark processed
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleSetStatus("discarded")}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Discard
            </button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Status: {post.status}</span>
        )}
      </div>
      {post.summary && (
        <div
          className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground shadow-sm"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      )}
      {post.link && (
        <a
          href={post.link}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Open original article →
        </a>
      )}
    </article>
  );
}

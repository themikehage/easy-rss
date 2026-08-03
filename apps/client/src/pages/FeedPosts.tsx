import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Feed } from "shared";
import PostsList from "../components/PostsList";
import { getErrorMessage } from "../lib/error";
import { getFeed } from "../lib/api";
import { usePostsRefresh } from "../lib/postsRefresh";

export default function FeedPosts() {
  const { feedId } = useParams();
  const { refreshKey } = usePostsRefresh();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const id = Number(feedId);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    setFeed(null);
    setError(null);
    getFeed(id)
      .then(setFeed)
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (Number.isNaN(id)) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{feed?.name ?? "Feed"}</h2>
        {feed?.url && (
          <p className="truncate text-sm text-muted-foreground">{feed.url}</p>
        )}
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
      <PostsList scope={{ type: "feed", feedId: id }} refreshKey={refreshKey} />
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { AdapterType, type Feed } from "shared";
import { createFeed, updateFeed } from "../lib/api";
import { getErrorMessage } from "../lib/error";
import { usePostsRefresh } from "../lib/postsRefresh";
import Modal from "./Modal";

const ADAPTER_LABELS: Record<AdapterType, string> = {
  rss: "RSS",
  atom: "Atom",
  json_feed: "JSON Feed",
};

const inputClass =
  "rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring";

interface FeedFormModalProps {
  projectId: number;
  feed: Feed | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function FeedFormModal({ projectId, feed, onClose, onSaved }: FeedFormModalProps) {
  const { bumpPosts } = usePostsRefresh();
  const [name, setName] = useState(feed?.name ?? "");
  const [url, setUrl] = useState(feed?.url ?? "");
  const [adapterType, setAdapterType] = useState<AdapterType>(feed?.adapterType ?? "rss");
  const [maxPosts, setMaxPosts] = useState(feed?.maxPosts ?? 50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (feed) {
        await updateFeed(feed.id, { name, url, adapter_type: adapterType, maxPosts });
      } else {
        await createFeed(projectId, { url, name, adapter_type: adapterType, maxPosts });
      }
      bumpPosts();
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={feed ? "Edit feed" : "Add feed"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Feed name"
          className={inputClass}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Feed URL"
          className={inputClass}
        />
        <select
          value={adapterType}
          onChange={(e) => setAdapterType(e.target.value as AdapterType)}
          className={inputClass}
        >
          {AdapterType.options.map((value) => (
            <option key={value} value={value}>
              {ADAPTER_LABELS[value]}
            </option>
          ))}
        </select>
        <label className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Max posts per fetch</span>
          <input
            type="number"
            min={1}
            max={500}
            value={maxPosts}
            onChange={(e) => setMaxPosts(Number(e.target.value))}
            className={`${inputClass} w-24`}
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || url.trim() === "" || name.trim() === ""}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : feed ? "Save" : "Add feed"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { AdapterType, type Feed, type Project } from "shared";
import { createFeed, fetchFeed, getFeed, listFeeds, updateFeed } from "../lib/api";
import { getErrorMessage } from "../lib/error";
import { usePostsRefresh } from "../lib/postsRefresh";

const ADAPTER_LABELS: Record<AdapterType, string> = {
  rss: "RSS",
  atom: "Atom",
  json_feed: "JSON Feed",
};

interface ProjectsPanelProps {
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  onCreateProject: (name: string) => Promise<Project>;
}

export default function ProjectsPanel({
  projects,
  projectsLoading,
  projectsError,
  onCreateProject,
}: ProjectsPanelProps) {
  const { projectId, feedId } = useParams();
  const navigate = useNavigate();
  const { bumpPosts } = usePostsRefresh();
  const [feedProjectId, setFeedProjectId] = useState<number | null>(null);

  const [projectName, setProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [feeds, setFeeds] = useState<Feed[] | null>(null);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [feedsError, setFeedsError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [adapterType, setAdapterType] = useState<AdapterType>("rss");
  const [creatingFeed, setCreatingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [pendingFeedId, setPendingFeedId] = useState<number | null>(null);
  const [fetchingFeedId, setFetchingFeedId] = useState<number | null>(null);

  useEffect(() => {
    if (feedId === undefined) {
      setFeedProjectId(null);
      return;
    }
    const id = Number(feedId);
    if (Number.isNaN(id)) {
      setFeedProjectId(null);
      return;
    }
    let cancelled = false;
    getFeed(id)
      .then((f) => {
        if (!cancelled) setFeedProjectId(f.projectId);
      })
      .catch(() => {
        if (!cancelled) setFeedProjectId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [feedId]);

  const activeProjectId =
    projectId !== undefined ? Number(projectId) : feedProjectId;

  const loadFeeds = useCallback(async (projectId: number) => {
    setFeedsLoading(true);
    setFeedsError(null);
    try {
      setFeeds(await listFeeds(projectId));
    } catch (err) {
      setFeedsError(getErrorMessage(err));
      setFeeds(null);
    } finally {
      setFeedsLoading(false);
    }
  }, []);

  useEffect(() => {
    setFeeds(null);
    setFeedsError(null);
    setFeedError(null);
    if (activeProjectId !== null && !Number.isNaN(activeProjectId)) {
      loadFeeds(activeProjectId);
    }
  }, [activeProjectId, loadFeeds]);

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    setCreatingProject(true);
    setProjectError(null);
    try {
      const project = await onCreateProject(projectName);
      setProjectName("");
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setProjectError(getErrorMessage(err));
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleAddFeed(e: FormEvent) {
    e.preventDefault();
    if (activeProjectId === null) return;
    setCreatingFeed(true);
    setFeedError(null);
    try {
      await createFeed(activeProjectId, { url, name, adapter_type: adapterType });
      setUrl("");
      setName("");
      setAdapterType("rss");
      await loadFeeds(activeProjectId);
      bumpPosts();
    } catch (err) {
      setFeedError(getErrorMessage(err));
    } finally {
      setCreatingFeed(false);
    }
  }

  async function handleToggleActive(feed: Feed) {
    if (activeProjectId === null) return;
    setPendingFeedId(feed.id);
    setFeedError(null);
    try {
      await updateFeed(feed.id, { active: !feed.active });
      await loadFeeds(activeProjectId);
    } catch (err) {
      setFeedError(getErrorMessage(err));
    } finally {
      setPendingFeedId(null);
    }
  }

  async function handleFetch(feed: Feed) {
    if (activeProjectId === null) return;
    setFetchingFeedId(feed.id);
    setFeedError(null);
    try {
      await fetchFeed(feed.id);
      await loadFeeds(activeProjectId);
      bumpPosts();
    } catch (err) {
      setFeedError(getErrorMessage(err));
    } finally {
      setFetchingFeedId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Projects</h2>
        <form onSubmit={handleCreateProject} className="mb-3 flex gap-2">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={creatingProject || projectName.trim() === ""}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {creatingProject ? "Creating…" : "Create project"}
          </button>
        </form>
        {projectError && <p className="mb-2 text-sm text-destructive">{projectError}</p>}
        {projectsLoading && <p className="text-sm text-muted-foreground">Loading projects…</p>}
        {projectsError && <p className="text-sm text-destructive">{projectsError}</p>}
        {!projectsLoading && !projectsError && projects.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet — create one above.</p>
        )}
        <ul className="flex flex-col gap-1">
          {projects.map((project) => (
            <li key={project.id}>
              <NavLink
                to={`/projects/${project.id}`}
                className={({ isActive }) =>
                  `block w-full rounded-md px-3 py-1.5 text-left text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-accent"
                  }`
                }
              >
                {project.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </section>

      {activeProjectId !== null && !Number.isNaN(activeProjectId) && (
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Feeds</h2>
          <form onSubmit={handleAddFeed} className="mb-3 flex flex-col gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Feed URL"
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Feed name"
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={adapterType}
                onChange={(e) => setAdapterType(e.target.value as AdapterType)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              >
                {AdapterType.options.map((value) => (
                  <option key={value} value={value}>
                    {ADAPTER_LABELS[value]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={creatingFeed || url.trim() === "" || name.trim() === ""}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {creatingFeed ? "Adding…" : "Add feed"}
              </button>
            </div>
          </form>
          {feedError && <p className="mb-2 text-sm text-destructive">{feedError}</p>}
          {feedsLoading && <p className="text-sm text-muted-foreground">Loading feeds…</p>}
          {feedsError && <p className="text-sm text-destructive">{feedsError}</p>}
          {!feedsLoading && !feedsError && feeds !== null && feeds.length === 0 && (
            <p className="text-sm text-muted-foreground">No feeds yet — add one above.</p>
          )}
          {feeds !== null && (
            <ul className="flex flex-col gap-2">
              {feeds.map((feed) => {
                const busy = pendingFeedId === feed.id || fetchingFeedId === feed.id;
                return (
                  <li key={feed.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <NavLink
                        to={`/feeds/${feed.id}`}
                        className="min-w-0"
                      >
                        {({ isActive }) => (
                          <div className={isActive ? "rounded-md bg-muted px-1" : "px-1"}>
                            <p className="truncate text-sm font-medium">{feed.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{feed.url}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                                {ADAPTER_LABELS[feed.adapterType]}
                              </span>
                              <span className={feed.active ? "text-primary" : "text-muted-foreground"}>
                                {feed.active ? "Active" : "Paused"}
                              </span>
                            </div>
                            {feed.lastError && (
                              <p className="mt-1 text-xs text-destructive">{feed.lastError}</p>
                            )}
                            {feed.lastFetchedAt && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Last fetched {new Date(feed.lastFetchedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </NavLink>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleToggleActive(feed)}
                          className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-50"
                        >
                          {feed.active ? "Pause" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleFetch(feed)}
                          className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-50"
                        >
                          {fetchingFeedId === feed.id ? "Fetching…" : "Fetch now"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

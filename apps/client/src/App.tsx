import { useCallback, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import type { Project } from "shared";
import { createProject, deleteProject, listProjects, updateProject } from "./lib/api";
import { getErrorMessage } from "./lib/error";
import { useTheme } from "./lib/theme";
import { PostsRefreshProvider } from "./lib/postsRefresh";
import ProjectsPanel from "./components/ProjectsPanel";
import ProjectPosts from "./pages/ProjectPosts";
import FeedPosts from "./pages/FeedPosts";
import PostDetail from "./pages/PostDetail";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      setProjects(await listProjects());
    } catch (err) {
      setProjectsError(getErrorMessage(err));
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = useCallback(
    async (name: string): Promise<Project> => {
      const project = await createProject(name);
      setProjects((prev) => [...prev, project]);
      return project;
    },
    [],
  );

  const handleUpdateProject = useCallback(async (id: number, name: string): Promise<void> => {
    const project = await updateProject(id, name);
    setProjects((prev) => prev.map((p) => (p.id === id ? project : p)));
  }, []);

  const handleDeleteProject = useCallback(async (id: number): Promise<void> => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <PostsRefreshProvider>
      <div className="min-h-screen">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-6 md:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Easy RSS</h1>
            <p className="text-sm text-muted-foreground">Aggregate RSS, Atom, and JSON feeds.</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
          <aside className="w-full shrink-0 md:w-80">
            <ProjectsPanel
              projects={projects}
              projectsLoading={projectsLoading}
              projectsError={projectsError}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          </aside>
          <section className="min-w-0 flex-1">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    {projectsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {projects.length === 0
                          ? "No projects yet — create one to get started."
                          : "Select a project or feed to view its posts."}
                      </p>
                    )}
                  </div>
                }
              />
              <Route path="/projects/:projectId" element={<ProjectPosts projects={projects} />} />
              <Route path="/feeds/:feedId" element={<FeedPosts />} />
              <Route path="/posts/:postId" element={<PostDetail />} />
            </Routes>
          </section>
        </main>
      </div>
    </PostsRefreshProvider>
  );
}

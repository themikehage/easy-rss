import { useCallback, useEffect, useState } from "react";
import type { Project } from "shared";
import { createProject, listProjects } from "./lib/api";
import { getErrorMessage } from "./lib/error";
import ProjectsPanel from "./components/ProjectsPanel";
import PostsList from "./components/PostsList";

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [postsKey, setPostsKey] = useState(0);

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

  const handleCreateProject = useCallback(async (name: string): Promise<Project> => {
    const project = await createProject(name);
    setProjects((prev) => [...prev, project]);
    setSelectedProjectId(project.id);
    return project;
  }, []);

  const handlePostsChanged = useCallback(() => {
    setPostsKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-4 py-6 md:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Easy RSS</h1>
        <p className="text-sm text-muted-foreground">Aggregate RSS, Atom, and JSON feeds.</p>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
        <aside className="w-full shrink-0 md:w-80">
          <ProjectsPanel
            projects={projects}
            projectsLoading={projectsLoading}
            projectsError={projectsError}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onCreateProject={handleCreateProject}
            onPostsChanged={handlePostsChanged}
          />
        </aside>
        <section className="min-w-0 flex-1">
          {selectedProjectId !== null ? (
            <PostsList projectId={selectedProjectId} refreshKey={postsKey} />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              {projectsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {projects.length === 0
                    ? "No projects yet — create one to get started."
                    : "Select a project to view its posts."}
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { useParams } from "react-router-dom";
import type { Project } from "shared";
import PostsList from "../components/PostsList";
import { usePostsRefresh } from "../lib/postsRefresh";

interface ProjectPostsProps {
  projects: Project[];
}

export default function ProjectPosts({ projects }: ProjectPostsProps) {
  const { projectId } = useParams();
  const { refreshKey } = usePostsRefresh();

  if (projectId === undefined) return null;
  const id = Number(projectId);
  if (Number.isNaN(id)) return null;

  const project = projects.find((p) => p.id === id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{project?.name ?? "Project"}</h2>
        <p className="text-sm text-muted-foreground">All posts across this project's feeds.</p>
      </div>
      <PostsList scope={{ type: "project", projectId: id }} refreshKey={refreshKey} />
    </div>
  );
}

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface PostsRefreshValue {
  refreshKey: number;
  bumpPosts: () => void;
}

const PostsRefreshContext = createContext<PostsRefreshValue | null>(null);

export function PostsRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpPosts = useCallback(() => setRefreshKey((k) => k + 1), []);
  return (
    <PostsRefreshContext.Provider value={{ refreshKey, bumpPosts }}>
      {children}
    </PostsRefreshContext.Provider>
  );
}

export function usePostsRefresh(): PostsRefreshValue {
  const value = useContext(PostsRefreshContext);
  if (!value) throw new Error("usePostsRefresh must be used within PostsRefreshProvider");
  return value;
}

import type { AdapterType } from "shared";
import type { FeedAdapter } from "./types";
import { rssAtomAdapter } from "./rss-atom";

export const adapterRegistry: Partial<Record<AdapterType, FeedAdapter>> = {
  rss: rssAtomAdapter,
  atom: rssAtomAdapter,
};

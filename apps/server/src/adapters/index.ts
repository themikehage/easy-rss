import type { AdapterType } from "shared";
import type { FeedAdapter } from "./types";
import { rssAtomAdapter } from "./rss-atom";
import { jsonFeedAdapter } from "./json-feed";

export const adapterRegistry: Partial<Record<AdapterType, FeedAdapter>> = {
  rss: rssAtomAdapter,
  atom: rssAtomAdapter,
  json_feed: jsonFeedAdapter,
};

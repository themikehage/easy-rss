import type { FeedAdapter, NormalizedPost, RawFeedItem } from "./types";

interface JsonFeedItem {
  id?: string;
  title?: string;
  url?: string;
  content_html?: string;
  content_text?: string;
  date_published?: string;
}

interface JsonFeed {
  items?: JsonFeedItem[];
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

class JsonFeedAdapter implements FeedAdapter {
  async fetch(feedUrl: string): Promise<RawFeedItem[]> {
    const res = await fetch(feedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${feedUrl}`);
    const json = (await res.json()) as JsonFeed;

    return (json.items ?? []).map((item) =>
      this.normalize({
        guid: String(item.id ?? item.url ?? ""),
        title: String(item.title ?? ""),
        link: String(item.url ?? ""),
        summary: String(item.content_html ?? item.content_text ?? ""),
        publishedAt: parseDate(item.date_published),
      }),
    );
  }

  normalize(item: RawFeedItem): NormalizedPost {
    return {
      guid: item.guid || item.link,
      title: item.title,
      link: item.link,
      summary: item.summary,
      publishedAt: item.publishedAt,
    };
  }
}

export const jsonFeedAdapter = new JsonFeedAdapter();

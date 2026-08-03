import { XMLParser } from "fast-xml-parser";
import type { FeedAdapter, NormalizedPost, RawFeedItem } from "./types";

interface RssItem {
  guid?: unknown;
  title?: unknown;
  link?: unknown;
  description?: unknown;
  pubDate?: unknown;
}

interface RssChannel {
  item?: RssItem[];
}

interface RssDoc {
  rss?: { channel?: RssChannel };
}

interface AtomEntry {
  id?: unknown;
  title?: unknown;
  link?: unknown;
  summary?: unknown;
  content?: unknown;
  published?: unknown;
  updated?: unknown;
}

interface AtomFeed {
  entry?: AtomEntry[];
}

interface AtomDoc {
  feed?: AtomFeed;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "item" || name === "entry",
});

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const text = obj["#text"] ?? obj.__cdata ?? obj["@_value"];
    if (typeof text === "string") return text;
    return "";
  }
  return "";
}

function linkOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const link = linkOf(candidate);
      if (link) return link;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const href = (value as Record<string, unknown>)["@_href"];
    if (typeof href === "string") return href;
  }
  return "";
}

function parseDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

class RssAtomAdapter implements FeedAdapter {
  async fetch(feedUrl: string): Promise<RawFeedItem[]> {
    const res = await fetch(feedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${feedUrl}`);
    const xml = await res.text();
    const doc = parser.parse(xml) as RssDoc & AtomDoc;

    if (doc.rss?.channel?.item) {
      return doc.rss.channel.item.map((it) =>
        this.normalize({
          guid: textOf(it.guid) || linkOf(it.link) || "",
          title: textOf(it.title),
          link: linkOf(it.link),
          summary: textOf(it.description),
          publishedAt: parseDate(textOf(it.pubDate)),
        }),
      );
    }

    if (doc.feed?.entry) {
      return doc.feed.entry.map((en) => {
        const link = linkOf(en.link);
        return this.normalize({
          guid: textOf(en.id) || link || "",
          title: textOf(en.title),
          link,
          summary: textOf(en.summary) || textOf(en.content),
          publishedAt: parseDate(textOf(en.published) || textOf(en.updated)),
        });
      });
    }

    return [];
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

export const rssAtomAdapter = new RssAtomAdapter();

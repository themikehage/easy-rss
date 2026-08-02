import { XMLParser } from "fast-xml-parser";
import type { FeedAdapter, NormalizedPost, RawFeedItem } from "./types";

interface RssItem {
  guid?: string;
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
}

interface RssChannel {
  item?: RssItem[];
}

interface RssDoc {
  rss?: { channel?: RssChannel };
}

interface AtomLink {
  "@_href"?: string;
}

interface AtomEntry {
  id?: string;
  title?: string;
  link?: string | AtomLink;
  summary?: string;
  content?: string;
  published?: string;
  updated?: string;
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

function parseDate(value: string | undefined): string | null {
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
          guid: String(it.guid ?? it.link ?? ""),
          title: String(it.title ?? ""),
          link: String(it.link ?? ""),
          summary: String(it.description ?? ""),
          publishedAt: parseDate(it.pubDate),
        }),
      );
    }

    if (doc.feed?.entry) {
      return doc.feed.entry.map((en) => {
        const link = typeof en.link === "string" ? en.link : (en.link?.["@_href"] ?? "");
        return this.normalize({
          guid: String(en.id ?? link ?? ""),
          title: String(en.title ?? ""),
          link: String(link ?? ""),
          summary: String(en.summary ?? en.content ?? ""),
          publishedAt: parseDate(en.published ?? en.updated),
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

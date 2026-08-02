export interface RawFeedItem {
  guid: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
}

export interface NormalizedPost {
  guid: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
}

export interface FeedAdapter {
  fetch(feedUrl: string): Promise<RawFeedItem[]>;
  normalize(item: RawFeedItem): NormalizedPost;
}

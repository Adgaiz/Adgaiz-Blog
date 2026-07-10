import 'server-only';

import { Redis } from '@upstash/redis';

const KEY_PREFIX = 'blog:views';
const TOTAL_KEY = `${KEY_PREFIX}:total`;
const VIEW_DEDUPE_SECONDS = 30 * 60;
const DAILY_DATA_RETENTION_SECONDS = 400 * 24 * 60 * 60;
const DASHBOARD_DAYS = 7;
const BLOG_TIME_ZONE = 'Asia/Shanghai';

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

function postKey(slug: string): string {
  return `${KEY_PREFIX}:post:${encodeURIComponent(slug)}`;
}

function dailyKey(date: string): string {
  return `${KEY_PREFIX}:day:${date}`;
}

function dedupeKey(slug: string, visitorId: string): string {
  return `${KEY_PREFIX}:seen:${encodeURIComponent(slug)}:${visitorId}`;
}

function toDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BLOG_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getRecentDays(count = DASHBOARD_DAYS): Array<{ date: string; label: string }> {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (count - index - 1));
    const dateKey = toDateKey(date);

    return {
      date: dateKey,
      label: dateKey.slice(5).replace('-', '/'),
    };
  });
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function isViewStoreConfigured(): boolean {
  return getRedis() !== null;
}

export async function getPostViewCount(slug: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  return toNumber(await redis.get<number>(postKey(slug)));
}

export async function getPostViewCounts(slugs: string[]): Promise<Record<string, number>> {
  const uniqueSlugs = [...new Set(slugs)];
  if (uniqueSlugs.length === 0) return {};

  const redis = getRedis();
  if (!redis) {
    return Object.fromEntries(uniqueSlugs.map((slug) => [slug, 0]));
  }

  const pipeline = redis.pipeline();
  uniqueSlugs.forEach((slug) => pipeline.get<number>(postKey(slug)));
  const values = await pipeline.exec<(number | null)[]>();

  return Object.fromEntries(
    uniqueSlugs.map((slug, index) => [slug, toNumber(values[index])]),
  );
}

export async function incrementPostView(
  slug: string,
  visitorId: string,
): Promise<{ counted: boolean; views: number; configured: boolean }> {
  const redis = getRedis();
  if (!redis) {
    return { counted: false, views: 0, configured: false };
  }

  const firstView = await redis.set(dedupeKey(slug, visitorId), '1', {
    nx: true,
    ex: VIEW_DEDUPE_SECONDS,
  });

  if (firstView !== 'OK') {
    return {
      counted: false,
      views: await getPostViewCount(slug),
      configured: true,
    };
  }

  const todayKey = dailyKey(toDateKey(new Date()));
  const [views] = await redis
    .pipeline()
    .incr(postKey(slug))
    .incr(TOTAL_KEY)
    .incr(todayKey)
    .expire(todayKey, DAILY_DATA_RETENTION_SECONDS)
    .exec<[number, number, number, number]>();

  return { counted: true, views: toNumber(views), configured: true };
}

export interface DashboardViewStats {
  configured: boolean;
  totalViews: number;
  todayViews: number;
  postViews: Record<string, number>;
  dailyViews: Array<{ date: string; label: string; views: number }>;
}

export async function getDashboardViewStats(slugs: string[]): Promise<DashboardViewStats> {
  const days = getRecentDays();
  const redis = getRedis();

  if (!redis) {
    return {
      configured: false,
      totalViews: 0,
      todayViews: 0,
      postViews: Object.fromEntries(slugs.map((slug) => [slug, 0])),
      dailyViews: days.map((day) => ({ ...day, views: 0 })),
    };
  }

  const uniqueSlugs = [...new Set(slugs)];
  const pipeline = redis.pipeline().get<number>(TOTAL_KEY);
  uniqueSlugs.forEach((slug) => pipeline.get<number>(postKey(slug)));
  days.forEach((day) => pipeline.get<number>(dailyKey(day.date)));

  const values = await pipeline.exec<(number | null)[]>();
  const postValuesStart = 1;
  const dailyValuesStart = postValuesStart + uniqueSlugs.length;
  const postViews = Object.fromEntries(
    uniqueSlugs.map((slug, index) => [slug, toNumber(values[postValuesStart + index])]),
  );
  const dailyViews = days.map((day, index) => ({
    ...day,
    views: toNumber(values[dailyValuesStart + index]),
  }));
  const trackedTotal = values[0];

  return {
    configured: true,
    totalViews:
      trackedTotal === null
        ? Object.values(postViews).reduce((total, views) => total + views, 0)
        : toNumber(trackedTotal),
    todayViews: dailyViews.at(-1)?.views ?? 0,
    postViews,
    dailyViews,
  };
}

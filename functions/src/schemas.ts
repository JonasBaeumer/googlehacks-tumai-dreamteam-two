import { z } from "zod";

/** Helpers */
export const IsoDate = z.string().datetime();                 // ISO 8601 timestamp (e.g., 2025-09-09T00:00:00Z)
export const NonNegInt = z.number().int().nonnegative();

/** Optional: unify source names early so your UI stays consistent */
export const Source = z.enum([
  "github",
  "stackoverflow",
  "leetcode",
  "mdn",
  "docs",
  "w3schools",
  "kaggle",
  "devto",
  "geeksforgeeks",
  "youtube",
  "other",
]);
export type Source = z.infer<typeof Source>;

/* =========================
   session
   ========================= */
export const SessionSchema = z.object({
  /** total active time in this session, in milliseconds */
  duration: NonNegInt,
  /** where activity came from (domains/platforms) */
  sources: z.array(Source).default([]),
  /** simple tags/topics touched during the session */
  topics: z.array(z.string()).default([]),
  /** session start (ISO 8601) */
  start_time: IsoDate,
  /** session end (ISO 8601) */
  end_time: IsoDate,
})
.refine(
  (s) => new Date(s.end_time).getTime() >= new Date(s.start_time).getTime(),
  { message: "end_time must be >= start_time", path: ["end_time"] }
);
export type Session = z.infer<typeof SessionSchema>;

/* =========================
   topics (per-topic aggregate)
   ========================= */
export const TopicStatsSchema = z.object({
  /** number of sessions that included this topic */
  session_per_topic: NonNegInt,
  /** total time spent on this topic (ms) */
  total_time_spent: NonNegInt,
  /** sources contributing to this topic */
  sources: z.array(Source).default([]),
  /** 0..1 activity score (e.g., attention/engagement) */
  average_activity: z.number().min(0).max(1),
  /** average session length for this topic (ms) */
  average_session_length: NonNegInt,
});
export type TopicStats = z.infer<typeof TopicStatsSchema>;

/* =========================
   daily (per-day aggregate)
   ========================= */
export const DailySchema = z.object({
  /** how many sessions this day */
  number_of_sessions: NonNegInt,
  /** total time spent this day (ms) */
  total_time_spent: NonNegInt,
  /** topics touched this day */
  topics_on_that_day: z.array(z.string()).default([]),
  /** average session length this day (ms) */
  avg_session_length: NonNegInt,
  /** distinct sources observed this day */
  list_of_sources: z.array(Source).default([]),
});
export type Daily = z.infer<typeof DailySchema>;

/* =========================
   Github (per-period aggregate)
   ========================= */
export const GithubSchema = z.object({
  /** total commits in the period */
  number_of_commits: NonNegInt,
  /** total lines changed/added (pick a consistent definition) */
  lines_of_code: NonNegInt,
  /** languages seen across repos/commits */
  langugages_used: z.array(z.string()).default([]), // (kept your key name; consider renaming to `languages_used`)
});
export type Github = z.infer<typeof GithubSchema>;

/* =========================
   XP (gamification totals)
   ========================= */
export const XPSchema = z.object({
  total_xp: NonNegInt,
  session_xp: NonNegInt,
  github_xp: NonNegInt,
  topic_xp: NonNegInt,
  daily_xp: NonNegInt,
  stream_xp: NonNegInt,
})
/** Optional: enforce a consistency constraint */
.refine(
  (x) =>
    x.total_xp >= x.session_xp + x.github_xp + x.topic_xp + x.daily_xp + x.stream_xp,
  { message: "total_xp must be >= sum of components", path: ["total_xp"] }
);
export type XP = z.infer<typeof XPSchema>;

/* =========================
   API Response Schemas
   ========================= */
export const SessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema),
  total: NonNegInt,
  page: NonNegInt,
  limit: NonNegInt,
});

export const TopicsResponseSchema = z.object({
  topics: z.record(z.string(), TopicStatsSchema),
  total_topics: NonNegInt,
});

export const DailyResponseSchema = z.object({
  daily_stats: z.record(z.string(), DailySchema), // date string -> daily stats
  total_days: NonNegInt,
});

export const GithubResponseSchema = z.object({
  github_stats: GithubSchema,
  period_start: IsoDate,
  period_end: IsoDate,
});

export const XPResponseSchema = z.object({
  xp: XPSchema,
  last_updated: IsoDate,
});

export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;
export type TopicsResponse = z.infer<typeof TopicsResponseSchema>;
export type DailyResponse = z.infer<typeof DailyResponseSchema>;
export type GithubResponse = z.infer<typeof GithubResponseSchema>;
export type XPResponse = z.infer<typeof XPResponseSchema>;

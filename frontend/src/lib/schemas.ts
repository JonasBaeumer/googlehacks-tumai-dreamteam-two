import { z } from "zod";

export const IsoDate = z.string().datetime();
export const NonNegInt = z.number().int().nonnegative();
export const YMD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Sessions (paginated)
export const SessionSchema = z.object({
  id: z.string().optional(),
  start_time: IsoDate,
  end_time: IsoDate,
  duration: NonNegInt, // ms
  sources: z.array(z.string()),
  topics: z.array(z.string()).default([]),
});
export type Session = z.infer<typeof SessionSchema>;

export const SessionsResponseSchema = z.object({
  data: z.array(SessionSchema),
  page: NonNegInt,
  limit: NonNegInt,
  total: NonNegInt.optional(),
});
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;

// Topics aggregate
export const TopicStatsSchema = z.object({
  topic: z.string(),
  session_per_topic: NonNegInt,
  total_time_spent: NonNegInt, // ms
  sources: z.array(z.string()).default([]),
  average_activity: z.number().min(0).max(1),
  average_session_length: NonNegInt, // ms
});
export type TopicStats = z.infer<typeof TopicStatsSchema>;
export const TopicsResponseSchema = z.array(TopicStatsSchema);

// Daily time series
export const DailySchema = z.object({
  date: YMD,
  number_of_sessions: NonNegInt,
  total_time_spent: NonNegInt, // ms
  topics_on_that_day: z.array(z.string()).default([]),
  avg_session_length: NonNegInt, // ms
  list_of_sources: z.array(z.string()).default([]),
});
export type Daily = z.infer<typeof DailySchema>;
export const DailyResponseSchema = z.array(DailySchema);

// GitHub aggregate
export const GithubSchema = z.object({
  number_of_commits: NonNegInt,
  lines_of_code: NonNegInt,
  languages_used: z.array(z.string()).default([]), // normalize if backend sends 'langugages_used'
});
export type Github = z.infer<typeof GithubSchema>;

// XP totals
export const XPSchema = z.object({
  total_xp: NonNegInt,
  session_xp: NonNegInt,
  github_xp: NonNegInt,
  topic_xp: NonNegInt,
  daily_xp: NonNegInt,
  stream_xp: NonNegInt,
});
export type XP = z.infer<typeof XPSchema>;

// Derived client-side streak shape
export const StreakSchema = z.object({
  current_streak: NonNegInt,
  longest_streak: NonNegInt,
  last_active_day: YMD.nullable(),
});
export type Streak = z.infer<typeof StreakSchema>;

// XP Level tiers (client-side computed)
export type XPTier = {
  name: string;
  threshold: number;
  color: string;
};

export const XP_TIERS: XPTier[] = [
  { name: "Bronze", threshold: 0, color: "bronze" },
  { name: "Silver", threshold: 250, color: "silver" },
  { name: "Gold", threshold: 500, color: "gold" },
  { name: "Platinum", threshold: 1000, color: "platinum" },
  { name: "Diamond", threshold: 2000, color: "diamond" },
  { name: "Legend", threshold: 5000, color: "legend" },
];
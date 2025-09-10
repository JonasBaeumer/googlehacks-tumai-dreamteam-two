import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  SessionsResponseSchema,
  TopicsResponseSchema,
  DailyResponseSchema,
  GithubSchema,
  XPSchema,
  type SessionsResponse,
  type TopicStats,
  type Daily,
  type Github,
  type XP,
  type Streak,
  XP_TIERS,
} from "./schemas";

// API URLs with CORS enabled
const API_ENDPOINTS = {
  demo: {
    sessions: "https://getsessionsdemo-vkb4ye2sla-uc.a.run.app",
    topics: "https://gettopicsdemo-vkb4ye2sla-uc.a.run.app", 
    daily: "https://getdailydemo-vkb4ye2sla-uc.a.run.app",
    github: "https://getgithubdemo-vkb4ye2sla-uc.a.run.app",
    xp: "https://getxpdemo-vkb4ye2sla-uc.a.run.app"
  },
  live: {
    sessions: "https://getsessions-vkb4ye2sla-uc.a.run.app",
    topics: "https://gettopics-vkb4ye2sla-uc.a.run.app",
    daily: "https://getdaily-vkb4ye2sla-uc.a.run.app",
    github: "https://getgithub-vkb4ye2sla-uc.a.run.app",
    xp: "https://getxp-vkb4ye2sla-uc.a.run.app"
  }
};

// Get endpoints based on user type
export const getEndpoints = (userType: 'demo' | 'live' = 'demo') => API_ENDPOINTS[userType];

// Generic fetch wrapper with error handling
async function apiCall<T>(url: string, schema: any, endpointName: string): Promise<T | null> {
  try {
    console.log(`🌐 Fetching: ${url}`);
    const response = await fetch(url);
    console.log(`📡 Response status: ${response.status} for ${endpointName}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📦 Raw data for ${endpointName}:`, data);
    
    const validatedData = schema.parse(data);
    console.log(`✅ Validated data for ${endpointName}:`, validatedData);
    
    return validatedData;
  } catch (error) {
    console.error(`❌ API Error (${endpointName}):`, error);
    toast({
      title: "Data Load Error",
      description: `Failed to load ${endpointName} data. Using cached data if available.`,
      variant: "destructive",
    });
    return null;
  }
}

// API endpoints with dynamic user type support
export const createApi = (userType: 'demo' | 'live' = 'demo') => {
  const endpoints = getEndpoints(userType);
  
  return {
    async getSessions(page = 1, limit = 10): Promise<SessionsResponse | null> {
      const url = `${endpoints.sessions}?page=${page}&limit=${limit}`;
      const result = await apiCall<any>(url, z.any(), "sessions");
      if (!result) return null;
      
      // Transform API response to match our schema
      const transformed = {
        data: result.sessions || [],
        page: result.page || page,
        limit: result.limit || limit,
        total: result.total
      };
      
      return SessionsResponseSchema.parse(transformed);
    },

    async getTopics(): Promise<TopicStats[] | null> {
      const result = await apiCall<any>(endpoints.topics, z.any(), "topics");
      if (!result || !result.topics) return null;
      
      // Transform object to array format
      const topicsArray = Object.entries(result.topics).map(([topic, stats]: [string, any]) => ({
        topic,
        session_per_topic: stats.session_per_topic,
        total_time_spent: stats.total_time_spent,
        sources: stats.sources || [],
        average_activity: stats.average_activity,
        average_session_length: stats.average_session_length
      }));
      
      return TopicsResponseSchema.parse(topicsArray);
    },

    async getDaily(): Promise<Daily[] | null> {
      const result = await apiCall<any>(endpoints.daily, z.any(), "daily");
      if (!result || !result.daily_stats) return null;
      
      // Transform object to array format
      const dailyArray = Object.entries(result.daily_stats).map(([date, stats]: [string, any]) => ({
        date,
        number_of_sessions: stats.number_of_sessions,
        total_time_spent: stats.total_time_spent,
        topics_on_that_day: stats.topics_on_that_day || [],
        avg_session_length: stats.avg_session_length,
        list_of_sources: stats.list_of_sources || []
      }));
      
      return DailyResponseSchema.parse(dailyArray);
    },

    async getGithub(): Promise<Github | null> {
      const result = await apiCall<any>(endpoints.github, z.any(), "github");
      if (!result || !result.github_stats) return null;
      
      const githubStats = result.github_stats;
      
      // Normalize 'langugages_used' typo to 'languages_used'
      if (githubStats.langugages_used && !githubStats.languages_used) {
        githubStats.languages_used = githubStats.langugages_used;
        delete githubStats.langugages_used;
      }
      
      const transformed = {
        number_of_commits: githubStats.number_of_commits,
        lines_of_code: githubStats.lines_of_code,
        languages_used: githubStats.languages_used || []
      };
      
      return GithubSchema.parse(transformed);
    },

    async getXP(): Promise<XP | null> {
      const result = await apiCall<any>(endpoints.xp, z.any(), "xp");
      if (!result || !result.xp) return null;
      
      return XPSchema.parse(result.xp);
    },
  };
};

// Default API instance for backward compatibility
export const api = createApi('demo');

// Derived data calculations
export function calculateStreaks(dailyData: Daily[]): Streak {
  if (!dailyData || dailyData.length === 0) {
    return {
      current_streak: 0,
      longest_streak: 0,
      last_active_day: null,
    };
  }

  // Sort by date descending
  const sortedDays = [...dailyData].sort((a, b) => b.date.localeCompare(a.date));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastActiveDay: string | null = null;

  // Find last active day
  for (const day of sortedDays) {
    if (day.number_of_sessions > 0 || day.total_time_spent > 0) {
      lastActiveDay = day.date;
      break;
    }
  }

  // Calculate current streak from most recent active day
  const today = new Date().toISOString().split("T")[0];
  let streakBroken = false;
  
  for (const day of sortedDays) {
    const isActive = day.number_of_sessions > 0 || day.total_time_spent > 0;
    
    if (isActive && !streakBroken) {
      currentStreak++;
    } else if (!streakBroken && day.date !== today) {
      // Allow today to be inactive without breaking streak
      streakBroken = true;
    }
  }

  // Calculate longest streak
  for (const day of dailyData.sort((a, b) => a.date.localeCompare(b.date))) {
    const isActive = day.number_of_sessions > 0 || day.total_time_spent > 0;
    
    if (isActive) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_active_day: lastActiveDay,
  };
}

export function calculateXPProgress(totalXP: number) {
  let currentTier = XP_TIERS[0];
  let nextTier = XP_TIERS[1];
  
  for (let i = 0; i < XP_TIERS.length; i++) {
    if (totalXP >= XP_TIERS[i].threshold) {
      currentTier = XP_TIERS[i];
      nextTier = XP_TIERS[i + 1] || XP_TIERS[i]; // Stay at max tier
    } else {
      break;
    }
  }
  
  const progressInCurrentTier = totalXP - currentTier.threshold;
  const tierRange = nextTier.threshold - currentTier.threshold;
  const progressPercent = tierRange > 0 ? (progressInCurrentTier / tierRange) * 100 : 100;
  
  return {
    currentTier,
    nextTier,
    progressPercent: Math.min(progressPercent, 100),
    progressInCurrentTier,
    xpToNextTier: Math.max(0, nextTier.threshold - totalXP),
  };
}

// Format time utilities
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
}
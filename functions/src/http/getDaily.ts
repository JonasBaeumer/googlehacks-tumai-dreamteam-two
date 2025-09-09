import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getDb} from "../config/admin";
import {DailyResponseSchema, DailySchema, Source} from "../schemas";

export const getDaily = onRequest(async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }
  
  if (request.method !== "GET") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const db = getDb();

  try {
    // Hardcoded user ID for demo purposes
    const uid = "anonymous_1757385512613";

    // Parse query parameters for date range
    const startDate = request.query.start_date as string;
    const endDate = request.query.end_date as string;
    
    let query = db.collection("users").doc(uid).collection("activity");
    
    if (startDate) {
      query = query.where("ts_start", ">=", startDate) as any;
    }
    if (endDate) {
      query = query.where("ts_start", "<=", endDate) as any;
    }

    // Get all sessions
    const sessionsSnapshot = await query.get();

    // Aggregate by date
    const dailyStats: Record<string, {
      sessions: any[];
      totalTime: number;
      topics: Set<string>;
      sources: Set<Source>;
      sessionDurations: number[];
    }> = {};

    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.date || new Date(data.ts_start).toISOString().split('T')[0];
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          sessions: [],
          totalTime: 0,
          topics: new Set(),
          sources: new Set(),
          sessionDurations: [],
        };
      }

      const source = mapDomainToSource(data.domain);
      const topics = extractTopicsFromData(data);
      const duration = data.active_ms || 0;

      dailyStats[date].sessions.push(data);
      dailyStats[date].totalTime += duration;
      topics.forEach(topic => dailyStats[date].topics.add(topic));
      if (source) {
        dailyStats[date].sources.add(source);
      }
      dailyStats[date].sessionDurations.push(duration);
    });

    // Convert to Daily format
    const dailyStatsFormatted: Record<string, any> = {};
    
    Object.entries(dailyStats).forEach(([date, stats]) => {
      const avgSessionLength = stats.sessionDurations.length > 0 
        ? Math.round(stats.sessionDurations.reduce((a, b) => a + b, 0) / stats.sessionDurations.length)
        : 0;

      dailyStatsFormatted[date] = {
        number_of_sessions: stats.sessions.length,
        total_time_spent: stats.totalTime,
        topics_on_that_day: Array.from(stats.topics),
        avg_session_length: avgSessionLength,
        list_of_sources: Array.from(stats.sources),
      };
    });

    // Validate each daily stat with Zod schema
    const validatedDailyStats: Record<string, any> = {};
    Object.entries(dailyStatsFormatted).forEach(([date, stats]) => {
      try {
        validatedDailyStats[date] = DailySchema.parse(stats);
      } catch (error) {
        logger.warn("Invalid daily stats", {date, stats, error});
      }
    });

    const responseData = {
      daily_stats: validatedDailyStats,
      total_days: Object.keys(validatedDailyStats).length,
    };

    // Validate response with Zod schema
    const validatedResponse = DailyResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get daily stats", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

/**
 * Maps a domain to a Source enum value
 */
function mapDomainToSource(domain: string): Source | null {
  const domainLower = domain.toLowerCase();
  
  if (domainLower.includes("github.com")) return "github";
  if (domainLower.includes("stackoverflow.com")) return "stackoverflow";
  if (domainLower.includes("leetcode.com")) return "leetcode";
  if (domainLower.includes("developer.mozilla.org")) return "mdn";
  if (domainLower.includes("docs.") || domainLower.includes("documentation")) return "docs";
  if (domainLower.includes("w3schools.com")) return "w3schools";
  if (domainLower.includes("kaggle.com")) return "kaggle";
  if (domainLower.includes("dev.to")) return "devto";
  if (domainLower.includes("geeksforgeeks.org")) return "geeksforgeeks";
  if (domainLower.includes("youtube.com")) return "youtube";
  
  return "other";
}

/**
 * Extracts topics from session data
 */
function extractTopicsFromData(data: any): string[] {
  const topics: string[] = [];
  
  const domain = data.domain?.toLowerCase() || "";
  const path = data.path?.toLowerCase() || "";
  
  if (domain.includes("leetcode") || path.includes("problem")) {
    topics.push("algorithms");
  }
  if (domain.includes("github") || path.includes("pull") || path.includes("commit")) {
    topics.push("version-control");
  }
  if (domain.includes("stackoverflow") || path.includes("question")) {
    topics.push("problem-solving");
  }
  if (path.includes("docs") || path.includes("documentation")) {
    topics.push("documentation");
  }
  if (domain.includes("react") || path.includes("react")) {
    topics.push("react");
  }
  if (domain.includes("javascript") || path.includes("js")) {
    topics.push("javascript");
  }
  if (domain.includes("python") || path.includes("python")) {
    topics.push("python");
  }
  
  return topics;
}

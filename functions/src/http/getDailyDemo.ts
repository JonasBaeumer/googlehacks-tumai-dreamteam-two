import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {DailyResponseSchema, DailySchema, Source} from "../schemas";

export const getDailyDemo = onRequest(async (request, response) => {
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

  try {
    // Generate realistic mock daily stats data spanning several months
    const mockDailyStats: Record<string, any> = {};

    // All available topics and sources
    const allTopics = [
      "algorithms", "react", "problem-solving", "version-control", "javascript",
      "documentation", "typescript", "data-structures", "testing", "api",
      "bug-fixing", "code-review", "dynamic-programming", "graph-theory",
      "machine-learning", "python", "sql", "docker", "kubernetes", "aws",
      "nodejs", "express", "mongodb", "redis", "webpack", "babel"
    ];
    
    const allSources: Source[] = [
      "github", "leetcode", "stackoverflow", "mdn", "docs", "kaggle", 
      "devto", "geeksforgeeks", "youtube", "other"
    ];

    // Generate data for the past 9 months (270 days) with realistic patterns
    for (let i = 270; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Create realistic daily patterns
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isRecent = i <= 30; // More activity in recent month
      const isOld = i > 180; // Less activity in older months
      
      // Seasonal patterns - more coding in winter, less in summer
      const month = date.getMonth();
      const isWinter = month >= 10 || month <= 2; // Nov-Feb
      const isSummer = month >= 5 && month <= 8; // Jun-Sep
      
      // Base activity level with seasonal adjustments
      let baseSessions = isWeekend ? 1 : 3;
      let baseTime = isWeekend ? 1800000 : 5400000; // 30min-1.5h
      
      // Apply seasonal adjustments
      if (isWinter) {
        baseSessions *= 1.4;
        baseTime *= 1.4;
      } else if (isSummer) {
        baseSessions *= 0.7;
        baseTime *= 0.7;
      }
      
      // Apply recency bias
      if (isRecent) {
        baseSessions *= 1.2;
        baseTime *= 1.2;
      } else if (isOld) {
        baseSessions *= 0.6;
        baseTime *= 0.6;
      }
      
      // Add realistic randomness and occasional zero days
      const randomFactor = Math.random() * 0.8 + 0.6; // 0.6 to 1.4
      const isZeroDay = Math.random() < 0.15; // 15% chance of zero activity
      
      const numberOfSessions = isZeroDay ? 0 : Math.max(0, Math.round(baseSessions * randomFactor));
      const totalTimeSpent = isZeroDay ? 0 : Math.round(baseTime * randomFactor);
      const avgSessionLength = numberOfSessions > 0 ? Math.round(totalTimeSpent / numberOfSessions) : 0;

      // Generate topics for the day (more variety in recent days)
      const numTopics = numberOfSessions > 0 ? Math.min(numberOfSessions, Math.floor(Math.random() * 6) + 1) : 0;
      const topicsOnThatDay = numberOfSessions > 0 ? allTopics
        .sort(() => Math.random() - 0.5)
        .slice(0, numTopics) : [];

      // Generate sources for the day
      const numSources = numberOfSessions > 0 ? Math.min(numberOfSessions, Math.floor(Math.random() * 4) + 1) : 0;
      const listOfSources = numberOfSessions > 0 ? allSources
        .sort(() => Math.random() - 0.5)
        .slice(0, numSources) : [];

      mockDailyStats[dateString] = {
        number_of_sessions: numberOfSessions,
        total_time_spent: totalTimeSpent,
        topics_on_that_day: topicsOnThatDay,
        avg_session_length: avgSessionLength,
        list_of_sources: listOfSources,
      };
    }

    // Add some special high-activity days for demo purposes
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Make today a high-activity day
    mockDailyStats[today] = {
      number_of_sessions: 12,
      total_time_spent: 21600000, // 6 hours
      topics_on_that_day: ["algorithms", "react", "problem-solving", "typescript", "testing", "api"],
      avg_session_length: 1800000, // 30 minutes
      list_of_sources: ["github", "leetcode", "stackoverflow", "docs", "mdn"],
    };

    // Make yesterday a moderate day
    mockDailyStats[yesterday] = {
      number_of_sessions: 6,
      total_time_spent: 10800000, // 3 hours
      topics_on_that_day: ["javascript", "documentation", "bug-fixing", "code-review"],
      avg_session_length: 1800000, // 30 minutes
      list_of_sources: ["github", "stackoverflow", "mdn"],
    };

    // Add a coding marathon day last week
    mockDailyStats[lastWeek] = {
      number_of_sessions: 15,
      total_time_spent: 28800000, // 8 hours
      topics_on_that_day: ["algorithms", "data-structures", "dynamic-programming", "graph-theory", "problem-solving"],
      avg_session_length: 1920000, // 32 minutes
      list_of_sources: ["leetcode", "github", "stackoverflow", "docs"],
    };

    // Add some historical high-activity periods (hackathons, learning sprints)
    const hackathon1 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const hackathon2 = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const learningSprint = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    mockDailyStats[hackathon1] = {
      number_of_sessions: 18,
      total_time_spent: 36000000, // 10 hours
      topics_on_that_day: ["react", "nodejs", "mongodb", "api", "testing", "docker"],
      avg_session_length: 2000000, // 33 minutes
      list_of_sources: ["github", "stackoverflow", "docs", "youtube", "devto"],
    };

    mockDailyStats[hackathon2] = {
      number_of_sessions: 20,
      total_time_spent: 43200000, // 12 hours
      topics_on_that_day: ["machine-learning", "python", "kaggle", "algorithms", "data-structures"],
      avg_session_length: 2160000, // 36 minutes
      list_of_sources: ["kaggle", "github", "stackoverflow", "docs", "youtube"],
    };

    mockDailyStats[learningSprint] = {
      number_of_sessions: 14,
      total_time_spent: 25200000, // 7 hours
      topics_on_that_day: ["typescript", "webpack", "babel", "testing", "api", "documentation"],
      avg_session_length: 1800000, // 30 minutes
      list_of_sources: ["mdn", "docs", "github", "stackoverflow", "devto"],
    };

    // Validate each daily stat with Zod schema
    const validatedDailyStats: Record<string, any> = {};
    Object.entries(mockDailyStats).forEach(([date, stats]) => {
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
    logger.error("Failed to get demo daily stats", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

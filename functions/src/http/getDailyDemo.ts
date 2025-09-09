import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {DailyResponseSchema, DailySchema, Source} from "../schemas";

export const getDailyDemo = onRequest(async (request, response) => {
  if (request.method !== "GET") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Generate realistic mock daily stats data for the past 30 days
    const mockDailyStats: Record<string, any> = {};

    // Generate data for the past 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Create realistic daily patterns
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isRecent = i <= 7; // More activity in recent days
      
      // Base activity level
      let baseSessions = isWeekend ? 2 : 4;
      let baseTime = isWeekend ? 3600000 : 7200000; // 1-2 hours
      
      // Add some randomness and recent bias
      const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 to 1.25
      const recentBoost = isRecent ? 1.3 : 1.0;
      
      const numberOfSessions = Math.max(0, Math.round(baseSessions * randomFactor * recentBoost));
      const totalTimeSpent = Math.round(baseTime * randomFactor * recentBoost);
      const avgSessionLength = numberOfSessions > 0 ? Math.round(totalTimeSpent / numberOfSessions) : 0;

      // Generate topics for the day
      const allTopics = [
        "algorithms", "react", "problem-solving", "version-control", "javascript",
        "documentation", "typescript", "data-structures", "testing", "api",
        "bug-fixing", "code-review", "dynamic-programming", "graph-theory"
      ];
      
      const numTopics = Math.min(numberOfSessions, Math.floor(Math.random() * 5) + 1);
      const topicsOnThatDay = allTopics
        .sort(() => Math.random() - 0.5)
        .slice(0, numTopics);

      // Generate sources for the day
      const allSources: Source[] = ["github", "leetcode", "stackoverflow", "mdn", "docs"];
      const numSources = Math.min(numberOfSessions, Math.floor(Math.random() * 3) + 1);
      const listOfSources = allSources
        .sort(() => Math.random() - 0.5)
        .slice(0, numSources);

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
    
    // Make today a high-activity day
    mockDailyStats[today] = {
      number_of_sessions: 8,
      total_time_spent: 14400000, // 4 hours
      topics_on_that_day: ["algorithms", "react", "problem-solving", "typescript", "testing"],
      avg_session_length: 1800000, // 30 minutes
      list_of_sources: ["github", "leetcode", "stackoverflow", "docs"],
    };

    // Make yesterday a moderate day
    mockDailyStats[yesterday] = {
      number_of_sessions: 5,
      total_time_spent: 9000000, // 2.5 hours
      topics_on_that_day: ["javascript", "documentation", "api", "bug-fixing"],
      avg_session_length: 1800000, // 30 minutes
      list_of_sources: ["github", "stackoverflow", "mdn"],
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

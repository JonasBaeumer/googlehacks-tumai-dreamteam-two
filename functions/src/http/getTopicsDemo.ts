import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {TopicsResponseSchema, TopicStatsSchema, Source} from "../schemas";

export const getTopicsDemo = onRequest(async (request, response) => {
  if (request.method !== "GET") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Generate realistic mock topics data
    const mockTopics = {
      "algorithms": {
        session_per_topic: 12,
        total_time_spent: 21600000, // 6 hours
        sources: ["leetcode" as Source],
        average_activity: 0.85,
        average_session_length: 1800000, // 30 minutes
      },
      "react": {
        session_per_topic: 8,
        total_time_spent: 19200000, // 5.33 hours
        sources: ["github" as Source, "docs" as Source],
        average_activity: 0.78,
        average_session_length: 2400000, // 40 minutes
      },
      "problem-solving": {
        session_per_topic: 15,
        total_time_spent: 18000000, // 5 hours
        sources: ["stackoverflow" as Source, "leetcode" as Source],
        average_activity: 0.72,
        average_session_length: 1200000, // 20 minutes
      },
      "version-control": {
        session_per_topic: 6,
        total_time_spent: 14400000, // 4 hours
        sources: ["github" as Source],
        average_activity: 0.88,
        average_session_length: 2400000, // 40 minutes
      },
      "javascript": {
        session_per_topic: 10,
        total_time_spent: 13500000, // 3.75 hours
        sources: ["mdn" as Source, "stackoverflow" as Source, "docs" as Source],
        average_activity: 0.75,
        average_session_length: 1350000, // 22.5 minutes
      },
      "documentation": {
        session_per_topic: 7,
        total_time_spent: 12600000, // 3.5 hours
        sources: ["docs" as Source, "mdn" as Source],
        average_activity: 0.65,
        average_session_length: 1800000, // 30 minutes
      },
      "typescript": {
        session_per_topic: 5,
        total_time_spent: 9000000, // 2.5 hours
        sources: ["github" as Source, "docs" as Source],
        average_activity: 0.82,
        average_session_length: 1800000, // 30 minutes
      },
      "data-structures": {
        session_per_topic: 4,
        total_time_spent: 7200000, // 2 hours
        sources: ["leetcode" as Source],
        average_activity: 0.80,
        average_session_length: 1800000, // 30 minutes
      },
      "testing": {
        session_per_topic: 3,
        total_time_spent: 5400000, // 1.5 hours
        sources: ["github" as Source, "stackoverflow" as Source],
        average_activity: 0.70,
        average_session_length: 1800000, // 30 minutes
      },
      "api": {
        session_per_topic: 4,
        total_time_spent: 4800000, // 1.33 hours
        sources: ["docs" as Source, "github" as Source],
        average_activity: 0.68,
        average_session_length: 1200000, // 20 minutes
      },
      "bug-fixing": {
        session_per_topic: 6,
        total_time_spent: 4500000, // 1.25 hours
        sources: ["github" as Source, "stackoverflow" as Source],
        average_activity: 0.90,
        average_session_length: 750000, // 12.5 minutes
      },
      "code-review": {
        session_per_topic: 2,
        total_time_spent: 3600000, // 1 hour
        sources: ["github" as Source],
        average_activity: 0.85,
        average_session_length: 1800000, // 30 minutes
      },
      "dynamic-programming": {
        session_per_topic: 3,
        total_time_spent: 2700000, // 45 minutes
        sources: ["leetcode" as Source],
        average_activity: 0.88,
        average_session_length: 900000, // 15 minutes
      },
      "graph-theory": {
        session_per_topic: 2,
        total_time_spent: 2100000, // 35 minutes
        sources: ["leetcode" as Source],
        average_activity: 0.75,
        average_session_length: 1050000, // 17.5 minutes
      },
      "web-apis": {
        session_per_topic: 3,
        total_time_spent: 1800000, // 30 minutes
        sources: ["mdn" as Source, "docs" as Source],
        average_activity: 0.70,
        average_session_length: 600000, // 10 minutes
      },
      "binary-search": {
        session_per_topic: 2,
        total_time_spent: 1350000, // 22.5 minutes
        sources: ["leetcode" as Source],
        average_activity: 0.80,
        average_session_length: 675000, // 11.25 minutes
      },
      "jest": {
        session_per_topic: 1,
        total_time_spent: 1200000, // 20 minutes
        sources: ["github" as Source, "docs" as Source],
        average_activity: 0.75,
        average_session_length: 1200000, // 20 minutes
      },
      "authentication": {
        session_per_topic: 2,
        total_time_spent: 1080000, // 18 minutes
        sources: ["docs" as Source],
        average_activity: 0.65,
        average_session_length: 540000, // 9 minutes
      },
      "two-pointers": {
        session_per_topic: 1,
        total_time_spent: 900000, // 15 minutes
        sources: ["leetcode" as Source],
        average_activity: 0.85,
        average_session_length: 900000, // 15 minutes
      },
      "refactoring": {
        session_per_topic: 1,
        total_time_spent: 2700000, // 45 minutes
        sources: ["github" as Source],
        average_activity: 0.90,
        average_session_length: 2700000, // 45 minutes
      },
      "clean-code": {
        session_per_topic: 1,
        total_time_spent: 1800000, // 30 minutes
        sources: ["github" as Source],
        average_activity: 0.80,
        average_session_length: 1800000, // 30 minutes
      },
      "css": {
        session_per_topic: 1,
        total_time_spent: 1200000, // 20 minutes
        sources: ["stackoverflow" as Source],
        average_activity: 0.60,
        average_session_length: 1200000, // 20 minutes
      },
      "styling": {
        session_per_topic: 1,
        total_time_spent: 900000, // 15 minutes
        sources: ["stackoverflow" as Source],
        average_activity: 0.55,
        average_session_length: 900000, // 15 minutes
      },
      "sliding-window": {
        session_per_topic: 1,
        total_time_spent: 2100000, // 35 minutes
        sources: ["leetcode" as Source],
        average_activity: 0.85,
        average_session_length: 2100000, // 35 minutes
      },
      "fetch": {
        session_per_topic: 1,
        total_time_spent: 900000, // 15 minutes
        sources: ["mdn" as Source],
        average_activity: 0.70,
        average_session_length: 900000, // 15 minutes
      },
      "async-programming": {
        session_per_topic: 1,
        total_time_spent: 900000, // 15 minutes
        sources: ["mdn" as Source],
        average_activity: 0.75,
        average_session_length: 900000, // 15 minutes
      },
      "hash-table": {
        session_per_topic: 1,
        total_time_spent: 1500000, // 25 minutes
        sources: ["leetcode" as Source],
        average_activity: 0.80,
        average_session_length: 1500000, // 25 minutes
      },
    };

    // Validate each topic with Zod schema
    const validatedTopics: Record<string, any> = {};
    Object.entries(mockTopics).forEach(([topic, stats]) => {
      try {
        validatedTopics[topic] = TopicStatsSchema.parse(stats);
      } catch (error) {
        logger.warn("Invalid topic stats", {topic, stats, error});
      }
    });

    const responseData = {
      topics: validatedTopics,
      total_topics: Object.keys(validatedTopics).length,
    };

    // Validate response with Zod schema
    const validatedResponse = TopicsResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get demo topics", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

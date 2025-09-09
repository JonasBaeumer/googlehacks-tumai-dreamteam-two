import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {SessionsResponseSchema, SessionSchema, Source} from "../schemas";

export const getSessionsDemo = onRequest(async (request, response) => {
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
    // Parse query parameters
    const page = parseInt(request.query.page as string) || 1;
    const limit = Math.min(parseInt(request.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    // Generate realistic mock sessions data
    const mockSessions = [
      {
        duration: 1800000, // 30 minutes
        sources: ["leetcode" as Source],
        topics: ["algorithms", "data-structures"],
        start_time: "2025-01-08T14:30:00Z",
        end_time: "2025-01-08T15:00:00Z",
      },
      {
        duration: 2400000, // 40 minutes
        sources: ["github" as Source],
        topics: ["version-control", "react"],
        start_time: "2025-01-08T13:00:00Z",
        end_time: "2025-01-08T13:40:00Z",
      },
      {
        duration: 1200000, // 20 minutes
        sources: ["stackoverflow" as Source],
        topics: ["problem-solving", "javascript"],
        start_time: "2025-01-08T12:15:00Z",
        end_time: "2025-01-08T12:35:00Z",
      },
      {
        duration: 3600000, // 60 minutes
        sources: ["github" as Source, "docs" as Source],
        topics: ["react", "documentation", "api"],
        start_time: "2025-01-08T10:00:00Z",
        end_time: "2025-01-08T11:00:00Z",
      },
      {
        duration: 900000, // 15 minutes
        sources: ["leetcode" as Source],
        topics: ["algorithms", "dynamic-programming"],
        start_time: "2025-01-08T09:30:00Z",
        end_time: "2025-01-08T09:45:00Z",
      },
      {
        duration: 2700000, // 45 minutes
        sources: ["github" as Source, "stackoverflow" as Source],
        topics: ["bug-fixing", "problem-solving", "typescript"],
        start_time: "2025-01-07T16:00:00Z",
        end_time: "2025-01-07T16:45:00Z",
      },
      {
        duration: 1500000, // 25 minutes
        sources: ["mdn" as Source],
        topics: ["documentation", "javascript", "web-apis"],
        start_time: "2025-01-07T15:00:00Z",
        end_time: "2025-01-07T15:25:00Z",
      },
      {
        duration: 2100000, // 35 minutes
        sources: ["leetcode" as Source],
        topics: ["algorithms", "graph-theory"],
        start_time: "2025-01-07T14:00:00Z",
        end_time: "2025-01-07T14:35:00Z",
      },
      {
        duration: 1800000, // 30 minutes
        sources: ["github" as Source],
        topics: ["code-review", "pull-requests"],
        start_time: "2025-01-07T13:00:00Z",
        end_time: "2025-01-07T13:30:00Z",
      },
      {
        duration: 1200000, // 20 minutes
        sources: ["stackoverflow" as Source],
        topics: ["problem-solving", "react", "hooks"],
        start_time: "2025-01-07T12:00:00Z",
        end_time: "2025-01-07T12:20:00Z",
      },
      {
        duration: 3000000, // 50 minutes
        sources: ["github" as Source, "docs" as Source],
        topics: ["nextjs", "documentation", "deployment"],
        start_time: "2025-01-06T16:00:00Z",
        end_time: "2025-01-06T16:50:00Z",
      },
      {
        duration: 1350000, // 22.5 minutes
        sources: ["leetcode" as Source],
        topics: ["algorithms", "binary-search"],
        start_time: "2025-01-06T15:00:00Z",
        end_time: "2025-01-06T15:22:30Z",
      },
      {
        duration: 2400000, // 40 minutes
        sources: ["github" as Source, "stackoverflow" as Source],
        topics: ["testing", "jest", "problem-solving"],
        start_time: "2025-01-06T14:00:00Z",
        end_time: "2025-01-06T14:40:00Z",
      },
      {
        duration: 1800000, // 30 minutes
        sources: ["docs" as Source],
        topics: ["documentation", "api", "authentication"],
        start_time: "2025-01-06T13:00:00Z",
        end_time: "2025-01-06T13:30:00Z",
      },
      {
        duration: 1500000, // 25 minutes
        sources: ["leetcode" as Source],
        topics: ["algorithms", "two-pointers"],
        start_time: "2025-01-06T12:00:00Z",
        end_time: "2025-01-06T12:25:00Z",
      },
      {
        duration: 2700000, // 45 minutes
        sources: ["github" as Source],
        topics: ["refactoring", "clean-code", "typescript"],
        start_time: "2025-01-05T16:00:00Z",
        end_time: "2025-01-05T16:45:00Z",
      },
      {
        duration: 1200000, // 20 minutes
        sources: ["stackoverflow" as Source],
        topics: ["problem-solving", "css", "styling"],
        start_time: "2025-01-05T15:00:00Z",
        end_time: "2025-01-05T15:20:00Z",
      },
      {
        duration: 2100000, // 35 minutes
        sources: ["leetcode" as Source],
        topics: ["algorithms", "sliding-window"],
        start_time: "2025-01-05T14:00:00Z",
        end_time: "2025-01-05T14:35:00Z",
      },
      {
        duration: 1800000, // 30 minutes
        sources: ["github" as Source, "mdn" as Source],
        topics: ["web-apis", "fetch", "async-programming"],
        start_time: "2025-01-05T13:00:00Z",
        end_time: "2025-01-05T13:30:00Z",
      },
      {
        duration: 1500000, // 25 minutes
        sources: ["leetcode" as Source],
        topics: ["algorithms", "hash-table"],
        start_time: "2025-01-05T12:00:00Z",
        end_time: "2025-01-05T12:25:00Z",
      },
    ];

    // Apply pagination
    const paginatedSessions = mockSessions.slice(offset, offset + limit);

    // Validate sessions with Zod schema
    const validatedSessions = paginatedSessions.map(session => {
      try {
        return SessionSchema.parse(session);
      } catch (error) {
        logger.warn("Invalid mock session data", {session, error});
        return session;
      }
    });

    const responseData = {
      sessions: validatedSessions,
      total: mockSessions.length,
      page: page,
      limit: limit,
    };

    // Validate response with Zod schema
    const validatedResponse = SessionsResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get demo sessions", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

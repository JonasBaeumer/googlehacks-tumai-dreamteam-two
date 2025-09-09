import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getDb} from "../config/admin";
import {TopicsResponseSchema, TopicStatsSchema, Source} from "../schemas";

export const getTopics = onRequest(async (request, response) => {
  if (request.method !== "GET") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const db = getDb();

  // Extract bearer token
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // Allow bypass in emulator for local testing if explicitly requested
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  const skipAuth = isEmulator && request.headers["x-skip-auth"] === "true";

  try {
    let uid = "";

    if (skipAuth) {
      uid = "emulator-test-user";
    } else if (token.startsWith("mock_token_")) {
      // Handle mock tokens for testing
      uid = token.replace("mock_token_", "");
      logger.info("Using mock token for testing", {uid, token});
    } else {
      if (!token) {
        response.status(401).send("Missing Authorization bearer token");
        return;
      }
      const decoded = await getAdminAuth().verifyIdToken(token);
      uid = decoded.uid;
    }

    // Get all sessions to analyze topics
    const sessionsSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("activity")
      .get();

    // Aggregate topic statistics
    const topicStats: Record<string, {
      sessions: Set<string>;
      totalTime: number;
      sources: Set<Source>;
      sessionDurations: number[];
    }> = {};

    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const topics = extractTopicsFromData(data);
      const source = mapDomainToSource(data.domain);
      const duration = data.active_ms || 0;

      topics.forEach(topic => {
        if (!topicStats[topic]) {
          topicStats[topic] = {
            sessions: new Set(),
            totalTime: 0,
            sources: new Set(),
            sessionDurations: [],
          };
        }

        topicStats[topic].sessions.add(doc.id);
        topicStats[topic].totalTime += duration;
        if (source) {
          topicStats[topic].sources.add(source);
        }
        topicStats[topic].sessionDurations.push(duration);
      });
    });

    // Convert to TopicStats format
    const topics: Record<string, any> = {};
    
    Object.entries(topicStats).forEach(([topic, stats]) => {
      const avgSessionLength = stats.sessionDurations.length > 0 
        ? Math.round(stats.sessionDurations.reduce((a, b) => a + b, 0) / stats.sessionDurations.length)
        : 0;

      // Calculate average activity (simplified - you might want to enhance this)
      const averageActivity = Math.min(1, Math.max(0, 
        stats.totalTime / (stats.sessions.size * 30000) // Assume 30s baseline
      ));

      topics[topic] = {
        session_per_topic: stats.sessions.size,
        total_time_spent: stats.totalTime,
        sources: Array.from(stats.sources),
        average_activity: averageActivity,
        average_session_length: avgSessionLength,
      };
    });

    // Validate each topic with Zod schema
    const validatedTopics: Record<string, any> = {};
    Object.entries(topics).forEach(([topic, stats]) => {
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
    logger.error("Failed to get topics", {
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

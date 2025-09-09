import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getDb} from "../config/admin";
import {SessionsResponseSchema, SessionSchema, Source} from "../schemas";

export const getSessions = onRequest(async (request, response) => {
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

    // Parse query parameters
    const page = parseInt(request.query.page as string) || 1;
    const limit = Math.min(parseInt(request.query.limit as string) || 50, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Get sessions from Firestore
    const sessionsSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("activity")
      .orderBy("ts_start", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    // Get total count for pagination
    const totalSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("activity")
      .get();

    const sessions = sessionsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Map domain to Source enum
      const source = mapDomainToSource(data.domain);
      
      // Extract topics from session group analysis if available
      const topics = extractTopicsFromData(data);
      
      return {
        duration: data.active_ms || 0,
        sources: source ? [source] : [],
        topics: topics,
        start_time: data.ts_start,
        end_time: data.ts_end,
      };
    });

    // Validate sessions with Zod schema
    const validatedSessions = sessions.map(session => {
      try {
        return SessionSchema.parse(session);
      } catch (error) {
        logger.warn("Invalid session data", {session, error});
        // Return a minimal valid session if validation fails
        return {
          duration: 0,
          sources: [],
          topics: [],
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
        };
      }
    });

    const responseData = {
      sessions: validatedSessions,
      total: totalSnapshot.size,
      page: page,
      limit: limit,
    };

    // Validate response with Zod schema
    const validatedResponse = SessionsResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get sessions", {
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
 * This is a simplified implementation - you might want to enhance this
 * based on your session group analysis data
 */
function extractTopicsFromData(data: any): string[] {
  const topics: string[] = [];
  
  // Extract topics from session group analysis if available
  if (data.session_group_id) {
    // You could query the session_group_analysis collection here
    // For now, we'll use simple heuristics based on domain and path
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
  }
  
  return topics;
}

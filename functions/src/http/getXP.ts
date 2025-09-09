import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getDb} from "../config/admin";
import {XPResponseSchema, XPSchema} from "../schemas";

export const getXP = onRequest(async (request, response) => {
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

    // Get all user data to calculate XP
    const [sessionsSnapshot, dailyStatsSnapshot, githubSessionsSnapshot] = await Promise.all([
      db.collection("users").doc(uid).collection("activity").get(),
      db.collection("users").doc(uid).collection("stats").get(),
      db.collection("users").doc(uid).collection("activity")
        .where("domain", "==", "github.com").get(),
    ]);

    // Calculate session XP (based on total time spent)
    let sessionXP = 0;
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const duration = data.active_ms || 0;
      // 1 XP per minute of coding
      sessionXP += Math.floor(duration / 60000);
    });

    // Calculate daily XP (based on daily streaks and consistency)
    let dailyXP = 0;
    const dailyStats = dailyStatsSnapshot.docs.map(doc => doc.data());
    dailyXP = dailyStats.length * 10; // 10 XP per day with activity

    // Calculate GitHub XP (based on commits and activity)
    let githubXP = 0;
    githubSessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const path = data.path?.toLowerCase() || "";
      const title = data.title?.toLowerCase() || "";
      
      // 50 XP per commit
      if (path.includes("/commit/") || title.includes("commit")) {
        githubXP += 50;
      }
      // 10 XP per GitHub session
      githubXP += 10;
    });

    // Calculate topic XP (based on variety of topics)
    const topics = new Set<string>();
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const extractedTopics = extractTopicsFromData(data);
      extractedTopics.forEach(topic => topics.add(topic));
    });
    const topicXP = topics.size * 25; // 25 XP per unique topic

    // Calculate stream XP (based on long coding sessions)
    let streamXP = 0;
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const duration = data.active_ms || 0;
      const minutes = duration / 60000;
      
      // Bonus XP for long sessions
      if (minutes >= 60) { // 1+ hour sessions
        streamXP += Math.floor(minutes / 60) * 20; // 20 XP per hour
      }
    });

    // Calculate total XP
    const totalXP = sessionXP + dailyXP + githubXP + topicXP + streamXP;

    const xpData = {
      total_xp: totalXP,
      session_xp: sessionXP,
      github_xp: githubXP,
      topic_xp: topicXP,
      daily_xp: dailyXP,
      stream_xp: streamXP,
    };

    // Validate with Zod schema
    const validatedXP = XPSchema.parse(xpData);

    const responseData = {
      xp: validatedXP,
      last_updated: new Date().toISOString(),
    };

    // Validate response with Zod schema
    const validatedResponse = XPResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get XP", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

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

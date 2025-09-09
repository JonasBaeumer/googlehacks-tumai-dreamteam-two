import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getDb} from "../config/admin";
import {XPResponseSchema, XPSchema} from "../schemas";

export const getXP = onRequest(async (request, response) => {
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

    // Get all user data to calculate XP from the correct collections
    const [sessionsSnapshot, dailyStatsSnapshot, githubSessionsSnapshot] = await Promise.all([
      db.collection("users").doc(uid).collection("sessions").get(),
      db.collection("users").doc(uid).collection("daily_stats").get(),
      db.collection("users").doc(uid).collection("sessions")
        .where("sources", "array-contains", "github").get(),
    ]);

    // Basic logging to see what collections exist
    logger.info("Collection counts", {
      uid,
      sessionsCount: sessionsSnapshot.docs.length,
      dailyStatsCount: dailyStatsSnapshot.docs.length,
      githubSessionsCount: githubSessionsSnapshot.docs.length
    });

    // Log sample session data if any exists
    if (sessionsSnapshot.docs.length > 0) {
      const sampleSession = sessionsSnapshot.docs[0].data();
      logger.info("Sample session data", {
        sessionId: sessionsSnapshot.docs[0].id,
        sampleData: sampleSession
      });
    } else {
      logger.info("No sessions found for user", { uid });
    }

    // Calculate session XP (based on total time spent)
    let sessionXP = 0;
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const duration = data.duration || 0; // Use 'duration' field from sessions collection
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
      const topics = data.topics || [];
      
      // 50 XP per commit (if topics include version-control)
      if (topics.includes("version-control")) {
        githubXP += 50;
      }
      // 10 XP per GitHub session
      githubXP += 10;
    });

    // Calculate topic XP (based on variety of topics)
    const topics = new Set<string>();
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const sessionTopics = data.topics || [];
      sessionTopics.forEach((topic: string) => topics.add(topic));
    });
    const topicXP = topics.size * 25; // 25 XP per unique topic

    // Calculate stream XP (based on long coding sessions)
    let streamXP = 0;
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const duration = data.duration || 0;
      const minutes = duration / 60000;
      
      // Bonus XP for long sessions
      if (minutes >= 60) { // 1+ hour sessions
        streamXP += Math.floor(minutes / 60) * 20; // 20 XP per hour
      }
    });

    // Calculate total XP
    const totalXP = sessionXP + dailyXP + githubXP + topicXP + streamXP;

    // Debug logging
    logger.info("XP Calculation Debug", {
      uid,
      sessionsCount: sessionsSnapshot.docs.length,
      dailyStatsCount: dailyStatsSnapshot.docs.length,
      githubSessionsCount: githubSessionsSnapshot.docs.length,
      sessionXP,
      dailyXP,
      githubXP,
      topicXP,
      streamXP,
      totalXP,
      topics: Array.from(topics)
    });

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



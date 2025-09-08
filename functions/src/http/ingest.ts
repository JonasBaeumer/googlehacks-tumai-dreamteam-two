import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getDb} from "../config/admin";
import {Firestore, FieldValue} from "firebase-admin/firestore";

export const ingest = onRequest(async (request, response) => {
  if (request.method !== "POST") {
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

    const activityData = request.body;

    if (!activityData || typeof activityData !== "object") {
      response.status(400).send("Missing or invalid activity data");
      return;
    }

    // Validate required fields
    const requiredFields = ["active_ms", "domain", "ts_start", "ts_end"];
    for (const field of requiredFields) {
      if (!activityData[field]) {
        response.status(400).send(`Missing required field: ${field}`);
        return;
      }
    }

    // Add user ID and timestamp
    const enrichedData = {
      ...activityData,
      uid,
      processed_at: new Date().toISOString(),
      date: new Date(activityData.ts_start)
        .toISOString().split("T")[0], // YYYY-MM-DD
    };

    // Store the activity session
    const sessionRef = await db.collection("users").doc(uid)
      .collection("activity").add(enrichedData);

    // Update user stats
    await updateUserStats(db, uid, enrichedData);

    // Update session group stats if it exists
    if (activityData.session_group_id) {
      await updateSessionGroupStats(db, uid, activityData);
    }

    logger.info("Activity ingested", {
      uid,
      sessionId: sessionRef.id,
      domain: activityData.domain,
      activeMs: activityData.active_ms,
      sessionGroupId: activityData.session_group_id,
    });

    response.status(200).json({
      ok: true,
      sessionId: sessionRef.id,
      message: "Activity data processed successfully",
    });
  } catch (error) {
    logger.error("Activity ingestion failed", {
      error: (error as Error).message,
      stack: (error as Error).stack,
      token: token.substring(0, 20) + "...", // Log first 20 chars of token
    });
    response.status(500).json({ok: false, error: "Internal server error"});
  }
});

/**
 * Updates user statistics for the given activity data
 * @param {Firestore} db The Firestore database instance
 * @param {string} uid The user ID
 * @param {any} activityData The activity data to process
 */
async function updateUserStats(db: Firestore, uid: string, activityData: any) {
  const today = new Date(activityData.ts_start)
    .toISOString().split("T")[0];
  const userStatsRef = db.collection("users").doc(uid)
    .collection("stats").doc(today);

  await userStatsRef.set({
    date: today,
    total_active_ms: activityData.active_ms,
    session_count: 1,
    domains: [activityData.domain],
    last_updated: new Date().toISOString(),
  }, {merge: true});

  // Update daily totals
  await userStatsRef.update({
    total_active_ms: FieldValue.increment(activityData.active_ms),
    session_count: FieldValue.increment(1),
    domains: FieldValue.arrayUnion(activityData.domain),
    last_updated: new Date().toISOString(),
  });
}

/**
 * Updates session group statistics for the given activity data
 * @param {Firestore} db The Firestore database instance
 * @param {string} uid The user ID
 * @param {any} activityData The activity data to process
 */
async function updateSessionGroupStats(db: Firestore, uid: string,
  activityData: any) {
  if (!activityData.session_group_id) return;

  const sessionGroupRef = db.collection("users").doc(uid)
    .collection("session_groups").doc(activityData.session_group_id);

  const sessionGroupData = {
    id: activityData.session_group_id,
    uid,
    start_time: activityData.ts_start,
    end_time: activityData.ts_end,
    total_duration: activityData.session_group_duration || 0,
    sites: activityData.session_group_sites || [],
    paths: activityData.session_group_paths || [],
    titles: activityData.session_group_titles || [],
    session_count: activityData.session_group_position || 1,
    last_updated: new Date().toISOString(),
  };

  await sessionGroupRef.set(sessionGroupData, {merge: true});
}

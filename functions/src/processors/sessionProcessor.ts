/**
 * Session Processor - Main orchestrator for processing session data
 * Based on pseudo code: "Procession after each session" and the complete flow
 */

import { getDb } from "../config/admin";
import * as logger from "firebase-functions/logger";
import { classifyUrls } from "./urlClassifier";
import { updateTopicStats, SessionTopicData } from "./topicProcessor";
import { updateDailyStats, updateStreak, DailyStats, StreakData } from "./dailyProcessor";
import { processSessionXP, SessionXPResult } from "./xpCalculator";

export interface SessionData {
  uid: string;
  duration: number;
  start_time: string;
  end_time: string;
  urls: string[];
  session_group_id?: string;
  session_group_sites?: string[];
  session_group_paths?: string[];
  session_group_titles?: string[];
}

export interface ProcessedSessionResult {
  sessionId: string;
  isCodingWebsite: boolean;
  topics: string[];
  sources: string[];
  xpResult: SessionXPResult;
  dailyStats: DailyStats;
  streakData: StreakData;
}

/**
 * Main function to process a session and update all related statistics
 * Based on pseudo code: "Procession after each session"
 * @param sessionData Session data to process
 * @returns Promise resolving to processing result
 */
export async function processSession(sessionData: SessionData): Promise<ProcessedSessionResult> {
  const db = getDb();
  
  try {
    logger.info("Starting session processing", { sessionData });
    
    // Step 1: Classify URLs to determine coding websites and topics
    const urlClassifications = classifyUrls(sessionData.urls);
    const codingClassifications = urlClassifications.filter(c => c.isCodingRelated);
    
    const isCodingWebsite = codingClassifications.length > 0;
    const topics = [...new Set(codingClassifications.map(c => c.topic).filter((topic): topic is string => topic !== null))];
    const sources = [...new Set(codingClassifications.map(c => c.domain))];
    
    logger.info("URL classification complete", {
      totalUrls: sessionData.urls.length,
      codingUrls: codingClassifications.length,
      topics,
      sources,
      isCodingWebsite
    });
    
    // Step 2: Store the session in the database
    const sessionRef = await db.collection("users").doc(sessionData.uid)
      .collection("sessions").add({
        ...sessionData,
        is_coding_website: isCodingWebsite,
        topics,
        sources,
        processed_at: new Date().toISOString(),
      });
    
    logger.info("Session stored", { sessionId: sessionRef.id });
    
    // Step 3: Update topic statistics
    if (isCodingWebsite && topics.length > 0) {
      const sessionTopics: SessionTopicData[] = topics.map(topic => ({
        topic,
        session_length_ms: sessionData.duration / topics.length, // Distribute time across topics
        source: sources[0] || 'unknown', // Use first source for simplicity
      }));
      
      await updateTopicStats(sessionData.uid, sessionTopics, sessionData.duration);
      logger.info("Topic stats updated", { topics: sessionTopics });
    }
    
    // Step 4: Update daily statistics
    const date = new Date(sessionData.start_time).toISOString().split('T')[0];
    const dailyStats = await updateDailyStats(
      sessionData.uid,
      date,
      {
        duration: sessionData.duration,
        topics,
        sources,
      },
      isCodingWebsite
    );
    
    logger.info("Daily stats updated", { date, dailyStats });
    
    // Step 5: Update streak information
    const streakData = await updateStreak(sessionData.uid, date, isCodingWebsite);
    logger.info("Streak updated", { streakData });
    
    // Step 6: Calculate and update XP
    const xpResult = await processSessionXP(
      sessionData.uid,
      sessionData.duration,
      streakData.current_streak,
      isCodingWebsite
    );
    
    logger.info("XP processed", { xpResult });
    
    // Step 7: Update session group if it exists
    if (sessionData.session_group_id) {
      await updateSessionGroup(sessionData.uid, sessionData);
      logger.info("Session group updated", { sessionGroupId: sessionData.session_group_id });
    }
    
    const result: ProcessedSessionResult = {
      sessionId: sessionRef.id,
      isCodingWebsite,
      topics,
      sources,
      xpResult,
      dailyStats,
      streakData,
    };
    
    logger.info("Session processing complete", { result });
    return result;
    
  } catch (error) {
    logger.error("Session processing failed", {
      sessionData,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

/**
 * Updates session group statistics
 * @param uid User ID
 * @param sessionData Session data
 */
async function updateSessionGroup(uid: string, sessionData: SessionData): Promise<void> {
  const db = getDb();
  
  try {
    if (!sessionData.session_group_id) return;
    
    const sessionGroupRef = db.collection("users").doc(uid)
      .collection("session_groups").doc(sessionData.session_group_id);
    
    const sessionGroupData = {
      id: sessionData.session_group_id,
      uid,
      start_time: sessionData.start_time,
      end_time: sessionData.end_time,
      total_duration: sessionData.duration,
      sites: sessionData.session_group_sites || [],
      paths: sessionData.session_group_paths || [],
      titles: sessionData.session_group_titles || [],
      session_count: 1,
      last_updated: new Date().toISOString(),
    };
    
    await sessionGroupRef.set(sessionGroupData, { merge: true });
    
    logger.info("Session group updated", {
      uid,
      sessionGroupId: sessionData.session_group_id,
      sessionGroupData
    });
  } catch (error) {
    logger.error("Failed to update session group", {
      uid,
      sessionData,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Processes multiple sessions in batch
 * @param sessions Array of session data to process
 * @returns Promise resolving to array of processing results
 */
export async function processSessions(sessions: SessionData[]): Promise<ProcessedSessionResult[]> {
  const results: ProcessedSessionResult[] = [];
  
  for (const session of sessions) {
    try {
      const result = await processSession(session);
      results.push(result);
    } catch (error) {
      logger.error("Failed to process session in batch", {
        session,
        error: (error as Error).message
      });
      // Continue processing other sessions even if one fails
    }
  }
  
  return results;
}

/**
 * Gets processing statistics for a user
 * @param uid User ID
 * @returns Promise resolving to processing statistics
 */
export async function getProcessingStats(uid: string): Promise<{
  totalSessions: number;
  codingSessions: number;
  totalXP: number;
  currentStreak: number;
  lastActivity: string;
}> {
  const db = getDb();
  
  try {
    // Get total sessions
    const sessionsSnapshot = await db.collection("users").doc(uid)
      .collection("sessions").get();
    
    const totalSessions = sessionsSnapshot.size;
    const codingSessions = sessionsSnapshot.docs.filter(doc => 
      doc.data().is_coding_website
    ).length;
    
    // Get XP data
    const xpDoc = await db.collection("users").doc(uid)
      .collection("user_stats").doc("xp").get();
    
    const totalXP = xpDoc.exists ? (xpDoc.data()?.total_xp || 0) : 0;
    
    // Get streak data
    const streakDoc = await db.collection("users").doc(uid)
      .collection("user_stats").doc("streak").get();
    
    const currentStreak = streakDoc.exists ? (streakDoc.data()?.current_streak || 0) : 0;
    const lastActivity = streakDoc.exists ? (streakDoc.data()?.last_activity_date || "") : "";
    
    return {
      totalSessions,
      codingSessions,
      totalXP,
      currentStreak,
      lastActivity,
    };
  } catch (error) {
    logger.error("Failed to get processing stats", {
      uid,
      error: (error as Error).message
    });
    throw error;
  }
}

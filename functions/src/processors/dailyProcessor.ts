/**
 * Daily Processor - Handles daily statistics and streak tracking
 * Based on pseudo code: "At the start of each day" and daily aggregation logic
 */

import { getDb } from "../config/admin";
import * as logger from "firebase-functions/logger";

export interface DailyStats {
  num_sessions: number;
  total_time_spent_ms: number;
  topics: string[];
  avg_session_length: number;
  source_list: string[];
  xp_day: number;
  streak_count: number;
  streak_noted: boolean;
}

export interface StreakData {
  current_streak: number;
  last_activity_date: string;
  streak_noted: boolean;
}

/**
 * Initializes daily stats for a new day
 * Based on pseudo code: "At the start of each day"
 * @param uid User ID
 * @param date Date string in YYYY-MM-DD format
 * @returns Promise resolving to initialized daily stats
 */
export async function initializeDailyStats(uid: string, date: string): Promise<DailyStats> {
  const db = getDb();
  
  const dailyStats: DailyStats = {
    num_sessions: 0,
    total_time_spent_ms: 0,
    topics: [],
    avg_session_length: 0,
    source_list: [],
    xp_day: 0,
    streak_count: 0,
    streak_noted: false,
  };
  
  const dailyRef = db.collection("users").doc(uid)
    .collection("daily_stats").doc(date);
  
  await dailyRef.set({
    ...dailyStats,
    date,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  });
  
  logger.info("Initialized daily stats", { uid, date, dailyStats });
  return dailyStats;
}

/**
 * Updates daily statistics for a session
 * Based on pseudo code: "{date}_num_sessions +=1" and related logic
 * @param uid User ID
 * @param date Date string in YYYY-MM-DD format
 * @param sessionData Session data to process
 * @param isCodingWebsite Whether this session includes coding websites
 * @returns Promise resolving to updated daily stats
 */
export async function updateDailyStats(
  uid: string,
  date: string,
  sessionData: {
    duration: number;
    topics: string[];
    sources: string[];
  },
  isCodingWebsite: boolean
): Promise<DailyStats> {
  const db = getDb();
  
  try {
    const dailyRef = db.collection("users").doc(uid)
      .collection("daily_stats").doc(date);
    
    // Get current daily stats
    const dailyDoc = await dailyRef.get();
    let currentStats: DailyStats;
    
    if (dailyDoc.exists) {
      currentStats = dailyDoc.data() as DailyStats;
    } else {
      // Initialize new day
      currentStats = await initializeDailyStats(uid, date);
    }
    
    // Update session count
    const newNumSessions = currentStats.num_sessions + 1;
    
    // Update time spent only if coding website is included
    const newTotalTime = isCodingWebsite 
      ? currentStats.total_time_spent_ms + sessionData.duration
      : currentStats.total_time_spent_ms;
    
    // Update average session length
    const newAvgSessionLength = newTotalTime / newNumSessions;
    
    // Update topics (add new ones)
    const updatedTopics = [...new Set([...currentStats.topics, ...sessionData.topics])];
    
    // Update sources (add new ones)
    const updatedSources = [...new Set([...currentStats.source_list, ...sessionData.sources])];
    
    const updatedStats: DailyStats = {
      num_sessions: newNumSessions,
      total_time_spent_ms: newTotalTime,
      topics: updatedTopics,
      avg_session_length: newAvgSessionLength,
      source_list: updatedSources,
      xp_day: currentStats.xp_day, // Will be updated by XP processor
      streak_count: currentStats.streak_count,
      streak_noted: currentStats.streak_noted,
    };
    
    await dailyRef.update({
      ...updatedStats,
      last_updated: new Date().toISOString(),
    });
    
    logger.info("Updated daily stats", {
      uid,
      date,
      updatedStats,
      isCodingWebsite
    });
    
    return updatedStats;
  } catch (error) {
    logger.error("Failed to update daily stats", {
      uid,
      date,
      sessionData,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Updates streak information
 * Based on pseudo code: "If not streak_noted" and streak logic
 * @param uid User ID
 * @param date Date string in YYYY-MM-DD format
 * @param isCodingWebsite Whether this session includes coding websites
 * @returns Promise resolving to updated streak data
 */
export async function updateStreak(
  uid: string,
  date: string,
  isCodingWebsite: boolean
): Promise<StreakData> {
  const db = getDb();
  
  try {
    const streakRef = db.collection("users").doc(uid)
      .collection("user_stats").doc("streak");
    
    const streakDoc = await streakRef.get();
    let streakData: StreakData;
    
    if (streakDoc.exists) {
      streakData = streakDoc.data() as StreakData;
    } else {
      // Initialize streak data
      streakData = {
        current_streak: 0,
        last_activity_date: "",
        streak_noted: false,
      };
    }
    
    // Check if this is a new day
    const isNewDay = streakData.last_activity_date !== date;
    
    if (isNewDay && isCodingWebsite) {
      // Check if yesterday was also a coding day (streak continues)
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (streakData.last_activity_date === yesterdayStr) {
        // Streak continues
        streakData.current_streak += 1;
      } else {
        // New streak starts
        streakData.current_streak = 1;
      }
      
      streakData.last_activity_date = date;
      streakData.streak_noted = true;
      
      await streakRef.set({
        ...streakData,
        last_updated: new Date().toISOString(),
      });
      
      logger.info("Updated streak", {
        uid,
        date,
        streakData,
        isCodingWebsite
      });
    }
    
    return streakData;
  } catch (error) {
    logger.error("Failed to update streak", {
      uid,
      date,
      isCodingWebsite,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Gets daily statistics for a date range
 * @param uid User ID
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Promise resolving to daily statistics
 */
export async function getDailyStats(
  uid: string,
  startDate: string,
  endDate: string
): Promise<Record<string, DailyStats>> {
  const db = getDb();
  
  try {
    const dailyStatsSnapshot = await db.collection("users").doc(uid)
      .collection("daily_stats")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date")
      .get();
    
    const dailyStats: Record<string, DailyStats> = {};
    
    dailyStatsSnapshot.forEach(doc => {
      const data = doc.data();
      dailyStats[doc.id] = {
        num_sessions: data.num_sessions || 0,
        total_time_spent_ms: data.total_time_spent_ms || 0,
        topics: data.topics || [],
        avg_session_length: data.avg_session_length || 0,
        source_list: data.source_list || [],
        xp_day: data.xp_day || 0,
        streak_count: data.streak_count || 0,
        streak_noted: data.streak_noted || false,
      };
    });
    
    return dailyStats;
  } catch (error) {
    logger.error("Failed to get daily stats", {
      uid,
      startDate,
      endDate,
      error: (error as Error).message
    });
    throw error;
  }
}

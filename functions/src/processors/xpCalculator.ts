/**
 * XP Calculator - Handles gamification and XP calculations
 * Based on pseudo code: "{xp}_session = ceil(0.0125*(t / 60.000 + 5) ** 2) * 0.1" and streak logic
 */

import { getDb } from "../config/admin";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export interface XPData {
  total_xp: number;
  session_xp: number;
  github_xp: number;
  topic_xp: number;
  daily_xp: number;
  stream_xp: number;
  streak_xp: number;
  last_updated: string;
}

export interface SessionXPResult {
  session_xp: number;
  streak_xp: number;
  total_xp_gained: number;
}

/**
 * Calculates XP for a session based on duration
 * Modified formula to ensure even short sessions get XP
 * @param durationMs Session duration in milliseconds
 * @returns Calculated session XP
 */
export function calculateSessionXP(durationMs: number): number {
  // Convert milliseconds to minutes
  const durationMinutes = durationMs / (1000 * 60);
  
  // Modified formula: Use a simpler calculation that gives XP even for short sessions
  // Original: ceil(0.0125*(t / 60.000 + 5) ** 2) * 0.1
  // New: Give 1 XP per minute, minimum 1 XP for any session
  const baseXP = Math.max(1, Math.round(durationMinutes));
  
  logger.info("Session XP calculation", {
    durationMs,
    durationMinutes,
    baseXP
  });
  
  return baseXP;
}

/**
 * Calculates streak XP bonus
 * Based on pseudo code: "{xp}_streak = 2*streak_count"
 * @param streakCount Current streak count
 * @returns Streak XP bonus
 */
export function calculateStreakXP(streakCount: number): number {
  return 2 * streakCount;
}

/**
 * Updates XP totals for a user
 * @param uid User ID
 * @param sessionXP Session XP gained
 * @param streakXP Streak XP bonus
 * @param isCodingWebsite Whether this session includes coding websites
 * @returns Promise resolving to updated XP data
 */
export async function updateXP(
  uid: string,
  sessionXP: number,
  streakXP: number,
  isCodingWebsite: boolean
): Promise<XPData> {
  const db = getDb();
  
  try {
    const xpRef = db.collection("users").doc(uid)
      .collection("user_stats").doc("xp");
    
    const xpDoc = await xpRef.get();
    let currentXP: XPData;
    
    if (xpDoc.exists) {
      currentXP = xpDoc.data() as XPData;
    } else {
      // Initialize XP data
      currentXP = {
        total_xp: 0,
        session_xp: 0,
        github_xp: 0,
        topic_xp: 0,
        daily_xp: 0,
        stream_xp: 0,
        streak_xp: 0,
        last_updated: new Date().toISOString(),
      };
    }
    
    // Update XP components
    const updatedXP: XPData = {
      total_xp: currentXP.total_xp + sessionXP + streakXP,
      session_xp: currentXP.session_xp + sessionXP,
      github_xp: currentXP.github_xp, // Will be updated separately
      topic_xp: currentXP.topic_xp, // Will be updated separately
      daily_xp: currentXP.daily_xp + sessionXP, // Daily XP includes session XP
      stream_xp: currentXP.stream_xp, // Will be updated separately
      streak_xp: currentXP.streak_xp + streakXP,
      last_updated: new Date().toISOString(),
    };
    
    await xpRef.set(updatedXP);
    
    logger.info("Updated XP", {
      uid,
      sessionXP,
      streakXP,
      updatedXP,
      isCodingWebsite
    });
    
    return updatedXP;
  } catch (error) {
    logger.error("Failed to update XP", {
      uid,
      sessionXP,
      streakXP,
      isCodingWebsite,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Updates daily XP for a specific date
 * @param uid User ID
 * @param date Date string in YYYY-MM-DD format
 * @param sessionXP Session XP gained
 * @returns Promise resolving to updated daily XP
 */
export async function updateDailyXP(
  uid: string,
  date: string,
  sessionXP: number
): Promise<number> {
  const db = getDb();
  
  try {
    const dailyRef = db.collection("users").doc(uid)
      .collection("daily_stats").doc(date);
    
    await dailyRef.update({
      xp_day: FieldValue.increment(sessionXP),
      last_updated: new Date().toISOString(),
    });
    
    logger.info("Updated daily XP", {
      uid,
      date,
      sessionXP
    });
    
    return sessionXP;
  } catch (error) {
    logger.error("Failed to update daily XP", {
      uid,
      date,
      sessionXP,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Gets current XP data for a user
 * @param uid User ID
 * @returns Promise resolving to XP data
 */
export async function getXP(uid: string): Promise<XPData> {
  const db = getDb();
  
  try {
    const xpDoc = await db.collection("users").doc(uid)
      .collection("user_stats").doc("xp").get();
    
    if (xpDoc.exists) {
      return xpDoc.data() as XPData;
    } else {
      // Return default XP data
      return {
        total_xp: 0,
        session_xp: 0,
        github_xp: 0,
        topic_xp: 0,
        daily_xp: 0,
        stream_xp: 0,
        streak_xp: 0,
        last_updated: new Date().toISOString(),
      };
    }
  } catch (error) {
    logger.error("Failed to get XP", {
      uid,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Calculates XP for a complete session processing
 * @param uid User ID
 * @param sessionDuration Session duration in milliseconds
 * @param streakCount Current streak count
 * @param isCodingWebsite Whether this session includes coding websites
 * @param date Date string in YYYY-MM-DD format for daily XP update
 * @returns Promise resolving to XP calculation result
 */
export async function processSessionXP(
  uid: string,
  sessionDuration: number,
  streakCount: number,
  isCodingWebsite: boolean,
  date?: string
): Promise<SessionXPResult> {
  try {
    // Calculate session XP
    const sessionXP = isCodingWebsite ? calculateSessionXP(sessionDuration) : 0;
    
    // Calculate streak XP
    const streakXP = isCodingWebsite ? calculateStreakXP(streakCount) : 0;
    
    // Update XP in database
    if (isCodingWebsite) {
      await updateXP(uid, sessionXP, streakXP, isCodingWebsite);
      
      // Update daily XP if date is provided
      if (date) {
        await updateDailyXP(uid, date, sessionXP);
      }
    }
    
    const result: SessionXPResult = {
      session_xp: sessionXP,
      streak_xp: streakXP,
      total_xp_gained: sessionXP + streakXP,
    };
    
    logger.info("Processed session XP", {
      uid,
      sessionDuration,
      streakCount,
      isCodingWebsite,
      date,
      result
    });
    
    return result;
  } catch (error) {
    logger.error("Failed to process session XP", {
      uid,
      sessionDuration,
      streakCount,
      isCodingWebsite,
      date,
      error: (error as Error).message
    });
    throw error;
  }
}

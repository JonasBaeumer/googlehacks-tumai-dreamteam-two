import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {getDb} from "../config/admin";

/**
 * Triggered when a session group is created.
 * Performs analysis and creates insights for the session group.
 * @param {import("firebase-functions/v2/firestore").FirestoreEvent} event
 * @return {Promise<void>} resolves when processing is complete
 */
export const onSessionGroupCreated = onDocumentCreated(
  "users/{uid}/session_groups/{groupId}",
  async (event): Promise<void> => {
    const db = getDb();
    const uid = event.params["uid"] as string;
    const groupId = event.params["groupId"] as string;
    const snapshot = event.data;
    
    if (!snapshot) {
      logger.warn("onSessionGroupCreated: missing snapshot", {uid, groupId});
      return;
    }
    
    const sessionGroupData = snapshot.data() as Record<string, unknown> | undefined;
    if (!sessionGroupData) {
      logger.warn("onSessionGroupCreated: no data", {uid, groupId});
      return;
    }
    
    try {
      // Perform session group analysis
      const analysis = await analyzeSessionGroup(sessionGroupData);
      
      // Store analysis results
      await db
        .collection("users")
        .doc(uid)
        .collection("session_group_analysis")
        .doc(groupId)
        .set({
          ...analysis,
          originalData: sessionGroupData,
          processedAt: new Date().toISOString(),
          sourceGroupId: groupId,
        }, {merge: true});
      
      logger.info("onSessionGroupCreated: analysis completed", {
        uid, 
        groupId, 
        analysis: analysis.summary
      });
    } catch (error) {
      logger.error("onSessionGroupCreated: analysis failed", {
        uid, 
        groupId, 
        error: (error as Error).message
      });
    }
  }
);

/**
 * Triggered when a session group is updated.
 * Re-analyzes the session group with updated data.
 * @param {import("firebase-functions/v2/firestore").FirestoreEvent} event
 * @return {Promise<void>} resolves when processing is complete
 */
export const onSessionGroupUpdated = onDocumentUpdated(
  "users/{uid}/session_groups/{groupId}",
  async (event): Promise<void> => {
    const db = getDb();
    const uid = event.params["uid"] as string;
    const groupId = event.params["groupId"] as string;
    const change = event.data;
    
    if (!change || !change.after) {
      logger.warn("onSessionGroupUpdated: missing change data", {uid, groupId});
      return;
    }
    
    const sessionGroupData = change.after.data() as Record<string, unknown> | undefined;
    if (!sessionGroupData) {
      logger.warn("onSessionGroupUpdated: no data", {uid, groupId});
      return;
    }
    
    try {
      // Re-analyze session group with updated data
      const analysis = await analyzeSessionGroup(sessionGroupData);
      
      // Update analysis results
      await db
        .collection("users")
        .doc(uid)
        .collection("session_group_analysis")
        .doc(groupId)
        .set({
          ...analysis,
          originalData: sessionGroupData,
          processedAt: new Date().toISOString(),
          sourceGroupId: groupId,
          updated: true,
        }, {merge: true});
      
      logger.info("onSessionGroupUpdated: analysis updated", {
        uid, 
        groupId, 
        analysis: analysis.summary
      });
    } catch (error) {
      logger.error("onSessionGroupUpdated: analysis failed", {
        uid, 
        groupId, 
        error: (error as Error).message
      });
    }
  }
);

/**
 * Analyzes a session group and generates insights
 * @param {Record<string, unknown>} sessionGroupData The session group data
 * @return {Promise<Record<string, unknown>>} Analysis results
 */
async function analyzeSessionGroup(sessionGroupData: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Extract key metrics
  const totalDuration = sessionGroupData.total_duration as number || 0;
  const sessionCount = sessionGroupData.session_count as number || 0;
  const sites = sessionGroupData.sites as string[] || [];
  const paths = sessionGroupData.paths as string[] || [];
  const titles = sessionGroupData.titles as string[] || [];
  const startTime = sessionGroupData.start_time as string;
  const endTime = sessionGroupData.end_time as string;
  
  // Calculate insights
  const avgSessionDuration = sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;
  const uniqueSites = [...new Set(sites)].length;
  const durationMinutes = Math.round(totalDuration / 60000); // Convert to minutes
  
  // Determine session type based on sites, URLs, and titles
  const sessionType = determineSessionType(sites, paths, titles);
  
  // Calculate productivity score (0-100)
  const productivityScore = calculateProductivityScore({
    totalDuration,
    sessionCount,
    uniqueSites,
    sessionType
  });
  
  // Generate summary
  const summary = generateSummary({
    durationMinutes,
    sessionCount,
    uniqueSites,
    sessionType,
    productivityScore
  });
  
  return {
    summary,
    metrics: {
      totalDurationMs: totalDuration,
      totalDurationMinutes: durationMinutes,
      sessionCount,
      avgSessionDurationMs: avgSessionDuration,
      uniqueSites,
      productivityScore,
      sessionType,
      sites: sites,
      paths: paths,
      titles: titles,
      startTime,
      endTime
    },
    insights: {
      isProductiveSession: productivityScore >= 70,
      isLongSession: durationMinutes >= 30,
      isMultiSiteSession: uniqueSites > 1,
      isFocusedSession: uniqueSites === 1 && sessionCount > 3
    }
  };
}

/**
 * Determines the type of coding session based on sites, URLs, and titles
 * @param {string[]} sites Array of site domains
 * @param {string[]} urls Array of full page URLs
 * @param {string[]} titles Array of page titles
 * @return {string} Session type
 */
function determineSessionType(sites: string[], urls: string[], titles: string[]): string {
  const uniqueSites = [...new Set(sites)];
  const allUrls = urls.join(' ').toLowerCase();
  const allTitles = titles.join(' ').toLowerCase();
  
  // Check for specific coding activities based on URLs and titles
  if (allUrls.includes('leetcode.com/problems/') || allTitles.includes('leetcode') || uniqueSites.includes('leetcode.com')) {
    return 'algorithm_practice';
  } else if (allUrls.includes('github.com') && (allUrls.includes('/pull/') || allUrls.includes('/commit/')) || allTitles.includes('pull request') || uniqueSites.includes('github.com')) {
    return 'code_review';
  } else if (allTitles.includes('stack overflow') || allTitles.includes('error') || allTitles.includes('problem') || uniqueSites.includes('stackoverflow.com')) {
    return 'problem_solving';
  } else if (allUrls.includes('/docs/') || allTitles.includes('documentation') || allTitles.includes('api') || allTitles.includes('guide')) {
    return 'learning';
  } else if (allUrls.includes('/issues/') || allTitles.includes('issue') || allTitles.includes('bug')) {
    return 'bug_fixing';
  } else if (allUrls.includes('/blob/') || allUrls.includes('/tree/') || allTitles.includes('source code') || allTitles.includes('repository')) {
    return 'code_exploration';
  } else if (uniqueSites.length === 1) {
    return 'focused_coding';
  } else {
    return 'mixed_activity';
  }
}

/**
 * Calculates a productivity score based on session metrics
 * @param {Object} metrics Session metrics
 * @return {number} Productivity score (0-100)
 */
function calculateProductivityScore(metrics: {
  totalDuration: number;
  sessionCount: number;
  uniqueSites: number;
  sessionType: string;
}): number {
  let score = 0;
  
  // Duration score (0-40 points)
  const durationMinutes = metrics.totalDuration / 60000;
  if (durationMinutes >= 30) score += 40;
  else if (durationMinutes >= 15) score += 30;
  else if (durationMinutes >= 5) score += 20;
  else score += 10;
  
  // Session count score (0-30 points)
  if (metrics.sessionCount >= 5) score += 30;
  else if (metrics.sessionCount >= 3) score += 20;
  else if (metrics.sessionCount >= 2) score += 15;
  else score += 10;
  
  // Focus score (0-20 points) - fewer sites = more focused
  if (metrics.uniqueSites === 1) score += 20;
  else if (metrics.uniqueSites === 2) score += 15;
  else if (metrics.uniqueSites <= 3) score += 10;
  else score += 5;
  
  // Session type bonus (0-10 points)
  const typeBonuses: Record<string, number> = {
    'algorithm_practice': 10,
    'focused_coding': 10,
    'learning': 8,
    'code_review': 7,
    'problem_solving': 6,
    'bug_fixing': 8,
    'code_exploration': 7,
    'mixed_activity': 3
  };
  
  score += typeBonuses[metrics.sessionType] || 0;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Generates a human-readable summary of the session group
 * @param {Object} data Summary data
 * @return {string} Summary text
 */
function generateSummary(data: {
  durationMinutes: number;
  sessionCount: number;
  uniqueSites: number;
  sessionType: string;
  productivityScore: number;
}): string {
  const {durationMinutes, sessionCount, uniqueSites, sessionType, productivityScore} = data;
  
  let summary = `Coding session: ${durationMinutes} minutes, ${sessionCount} sessions`;
  
  if (uniqueSites > 1) {
    summary += ` across ${uniqueSites} sites`;
  }
  
  summary += `. Type: ${sessionType.replace('_', ' ')}`;
  
  if (productivityScore >= 80) {
    summary += '. Highly productive!';
  } else if (productivityScore >= 60) {
    summary += '. Good productivity.';
  } else if (productivityScore >= 40) {
    summary += '. Moderate activity.';
  } else {
    summary += '. Light activity.';
  }
  
  return summary;
}

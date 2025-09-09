/**
 * Topic Processor - Handles topic-based statistics updates
 * Based on pseudo code: "For each Topic: Topic = Int: {topic}_num_of_sessions, Int: {topic}_total_spend_time, List(strings): {topic}_source_list"
 */

import { getDb } from "../config/admin";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export interface TopicStats {
  num_of_sessions: number;
  total_time_spent: number;
  source_list: string[];
  avg_session_length: number;
}

export interface SessionTopicData {
  topic: string;
  session_length_ms: number;
  source: string;
}

/**
 * Updates topic statistics in the database
 * @param uid User ID
 * @param sessionTopics Array of topic data from the session
 * @param sessionDuration Total session duration in milliseconds
 */
export async function updateTopicStats(
  uid: string, 
  sessionTopics: SessionTopicData[], 
  sessionDuration: number
): Promise<void> {
  const db = getDb();
  
  try {
    // Process each topic from the session
    for (const topicData of sessionTopics) {
      const { topic, source } = topicData;
      
      // Calculate average time per topic for this session
      const numTopics = sessionTopics.length;
      const avgTimeOnTopic = sessionDuration / numTopics;
      
      const topicRef = db.collection("users").doc(uid)
        .collection("topics").doc(topic);
      
      // Get current topic stats
      const topicDoc = await topicRef.get();
      
      if (topicDoc.exists) {
        // Update existing topic
        const currentData = topicDoc.data() as TopicStats;
        const newNumSessions = currentData.num_of_sessions + 1;
        const newTotalTime = currentData.total_time_spent + avgTimeOnTopic;
        const newAvgLength = newTotalTime / newNumSessions;
        
        await topicRef.update({
          num_of_sessions: newNumSessions,
          total_time_spent: newTotalTime,
          avg_session_length: newAvgLength,
          source_list: FieldValue.arrayUnion(source),
          last_updated: new Date().toISOString(),
        });
        
        logger.info("Updated existing topic", {
          uid,
          topic,
          newNumSessions,
          newTotalTime,
          newAvgLength
        });
      } else {
        // Create new topic
        const newTopicStats: TopicStats = {
          num_of_sessions: 1,
          total_time_spent: avgTimeOnTopic,
          source_list: [source],
          avg_session_length: avgTimeOnTopic,
        };
        
        await topicRef.set({
          ...newTopicStats,
          topic,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        });
        
        logger.info("Created new topic", {
          uid,
          topic,
          newTopicStats
        });
      }
    }
  } catch (error) {
    logger.error("Failed to update topic stats", {
      uid,
      sessionTopics,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Gets all topic statistics for a user
 * @param uid User ID
 * @returns Promise resolving to topic statistics
 */
export async function getTopicStats(uid: string): Promise<Record<string, TopicStats>> {
  const db = getDb();
  
  try {
    const topicsSnapshot = await db.collection("users").doc(uid)
      .collection("topics").get();
    
    const topics: Record<string, TopicStats> = {};
    
    topicsSnapshot.forEach(doc => {
      const data = doc.data();
      topics[doc.id] = {
        num_of_sessions: data.num_of_sessions || 0,
        total_time_spent: data.total_time_spent || 0,
        source_list: data.source_list || [],
        avg_session_length: data.avg_session_length || 0,
      };
    });
    
    return topics;
  } catch (error) {
    logger.error("Failed to get topic stats", {
      uid,
      error: (error as Error).message
    });
    throw error;
  }
}

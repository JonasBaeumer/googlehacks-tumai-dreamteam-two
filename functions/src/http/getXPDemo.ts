import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {XPResponseSchema, XPSchema} from "../schemas";

export const getXPDemo = onRequest(async (request, response) => {
  if (request.method !== "GET") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Generate realistic mock XP data for an active developer
    const mockXPData = {
      total_xp: 2847,
      session_xp: 1247, // Based on ~20 hours of coding (1 XP per minute)
      github_xp: 850,   // 17 commits * 50 XP + GitHub activity
      topic_xp: 425,    // 17 unique topics * 25 XP
      daily_xp: 300,    // 30 days with activity * 10 XP
      stream_xp: 25,    // Bonus for long coding sessions
    };

    // Validate with Zod schema
    const validatedXP = XPSchema.parse(mockXPData);

    const responseData = {
      xp: validatedXP,
      last_updated: new Date().toISOString(),
    };

    // Validate response with Zod schema
    const validatedResponse = XPResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get demo XP", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

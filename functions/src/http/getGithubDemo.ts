import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {GithubResponseSchema, GithubSchema} from "../schemas";

export const getGithubDemo = onRequest(async (request, response) => {
  if (request.method !== "GET") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Generate realistic mock GitHub stats
    const mockGithubStats = {
      number_of_commits: 47,
      lines_of_code: 2847,
      langugages_used: [
        "TypeScript",
        "JavaScript", 
        "React",
        "CSS",
        "HTML",
        "JSON",
        "Markdown",
        "YAML",
        "Shell",
        "Python"
      ],
    };

    // Validate with Zod schema
    const validatedGithubStats = GithubSchema.parse(mockGithubStats);

    // Calculate period dates (last 30 days by default)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const responseData = {
      github_stats: validatedGithubStats,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
    };

    // Validate response with Zod schema
    const validatedResponse = GithubResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get demo GitHub stats", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

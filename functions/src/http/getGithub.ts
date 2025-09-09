import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getDb} from "../config/admin";
import {GithubResponseSchema, GithubSchema} from "../schemas";

export const getGithub = onRequest(async (request, response) => {
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
    const uid = "anonymous_1757418697421";

    // Parse query parameters for date range
    const startDate = request.query.start_date as string;
    const endDate = request.query.end_date as string;
    
    let query = db.collection("users").doc(uid).collection("activity");
    
    if (startDate) {
      query = query.where("ts_start", ">=", startDate) as any;
    }
    if (endDate) {
      query = query.where("ts_start", "<=", endDate) as any;
    }

    // Get GitHub-related sessions
    const githubSessionsSnapshot = await query
      .where("domain", "==", "github.com")
      .get();

    // Analyze GitHub activity
    let numberOfCommits = 0;
    let linesOfCode = 0;
    const languagesUsed = new Set<string>();

    githubSessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const path = data.path?.toLowerCase() || "";
      const title = data.title?.toLowerCase() || "";
      
      // Count commits (simplified heuristic)
      if (path.includes("/commit/") || title.includes("commit")) {
        numberOfCommits++;
      }
      
      // Estimate lines of code (simplified heuristic)
      // This is a rough estimate based on session duration
      const sessionDuration = data.active_ms || 0;
      const estimatedLinesPerMinute = 10; // Rough estimate
      const minutesSpent = sessionDuration / 60000;
      linesOfCode += Math.round(minutesSpent * estimatedLinesPerMinute);
      
      // Extract languages from paths and titles
      const languagePatterns = [
        { pattern: /\.js$|javascript/i, language: "JavaScript" },
        { pattern: /\.ts$|typescript/i, language: "TypeScript" },
        { pattern: /\.py$|python/i, language: "Python" },
        { pattern: /\.java$|java/i, language: "Java" },
        { pattern: /\.cpp$|\.cc$|\.cxx$|c\+\+/i, language: "C++" },
        { pattern: /\.c$|c\b/i, language: "C" },
        { pattern: /\.cs$|c#/i, language: "C#" },
        { pattern: /\.php$/i, language: "PHP" },
        { pattern: /\.rb$|ruby/i, language: "Ruby" },
        { pattern: /\.go$|golang/i, language: "Go" },
        { pattern: /\.rs$|rust/i, language: "Rust" },
        { pattern: /\.swift$/i, language: "Swift" },
        { pattern: /\.kt$|kotlin/i, language: "Kotlin" },
        { pattern: /\.scala$/i, language: "Scala" },
        { pattern: /\.html$/i, language: "HTML" },
        { pattern: /\.css$/i, language: "CSS" },
        { pattern: /\.scss$/i, language: "SCSS" },
        { pattern: /\.json$/i, language: "JSON" },
        { pattern: /\.xml$/i, language: "XML" },
        { pattern: /\.sql$/i, language: "SQL" },
        { pattern: /\.sh$/i, language: "Shell" },
        { pattern: /\.yaml$|\.yml$/i, language: "YAML" },
        { pattern: /\.md$/i, language: "Markdown" },
      ];

      languagePatterns.forEach(({ pattern, language }) => {
        if (pattern.test(path) || pattern.test(title)) {
          languagesUsed.add(language);
        }
      });
    });

    const githubStats = {
      number_of_commits: numberOfCommits,
      lines_of_code: linesOfCode,
      langugages_used: Array.from(languagesUsed),
    };

    // Validate with Zod schema
    const validatedGithubStats = GithubSchema.parse(githubStats);

    const responseData = {
      github_stats: validatedGithubStats,
      period_start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days ago
      period_end: endDate || new Date().toISOString(),
    };

    // Validate response with Zod schema
    const validatedResponse = GithubResponseSchema.parse(responseData);

    response.status(200).json(validatedResponse);
  } catch (error) {
    logger.error("Failed to get GitHub stats", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    response.status(500).json({error: "Internal server error"});
  }
});

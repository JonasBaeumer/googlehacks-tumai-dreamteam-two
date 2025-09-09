/**
 * URL Classifier - Determines if a URL is coding-related and extracts topic
 * Based on pseudo code: "Run url_classifier (=> is_coding_related & coding_topic) on every item"
 */

export interface UrlClassificationResult {
  isCodingRelated: boolean;
  topic: string | null;
  domain: string;
}

/**
 * Classifies a URL to determine if it's coding-related and what topic it represents
 * @param url The full URL to classify
 * @returns Classification result with coding status and topic
 */
export function classifyUrl(url: string): UrlClassificationResult {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const path = urlObj.pathname.toLowerCase();
    
    // Extract domain (remove www. prefix)
    const cleanDomain = domain.replace(/^www\./, '');
    
    // Define coding-related domains and their topics
    const codingDomains: Record<string, string> = {
      'github.com': 'version-control',
      'gitlab.com': 'version-control',
      'bitbucket.org': 'version-control',
      'leetcode.com': 'algorithms',
      'hackerrank.com': 'algorithms',
      'codewars.com': 'algorithms',
      'codeforces.com': 'algorithms',
      'stackoverflow.com': 'problem-solving',
      'stackexchange.com': 'problem-solving',
      'developer.mozilla.org': 'documentation',
      'mdn.mozilla.org': 'documentation',
      'docs.microsoft.com': 'documentation',
      'docs.python.org': 'documentation',
      'reactjs.org': 'react',
      'vuejs.org': 'vue',
      'angular.io': 'angular',
      'nodejs.org': 'nodejs',
      'expressjs.com': 'express',
      'mongodb.com': 'mongodb',
      'redis.io': 'redis',
      'docker.com': 'docker',
      'kubernetes.io': 'kubernetes',
      'aws.amazon.com': 'aws',
      'kaggle.com': 'machine-learning',
      'dev.to': 'devto',
      'geeksforgeeks.org': 'geeksforgeeks',
      'youtube.com': 'youtube',
      'w3schools.com': 'w3schools',
    };
    
    // Check for exact domain match
    if (codingDomains[cleanDomain]) {
      return {
        isCodingRelated: true,
        topic: codingDomains[cleanDomain],
        domain: cleanDomain
      };
    }
    
    // Check for path-based classification
    const pathBasedTopics: Record<string, string> = {
      '/problems/': 'algorithms',
      '/challenges/': 'algorithms',
      '/contest/': 'algorithms',
      '/pull/': 'code-review',
      '/commit/': 'version-control',
      '/issues/': 'bug-fixing',
      '/wiki/': 'documentation',
      '/docs/': 'documentation',
      '/api/': 'api',
      '/tutorial/': 'learning',
      '/guide/': 'learning',
      '/blog/': 'learning',
    };
    
    for (const [pathPattern, topic] of Object.entries(pathBasedTopics)) {
      if (path.includes(pathPattern)) {
        return {
          isCodingRelated: true,
          topic: topic,
          domain: cleanDomain
        };
      }
    }
    
    // Check for common coding file extensions in path
    const codingExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml', '.md', '.sql'];
    
    for (const ext of codingExtensions) {
      if (path.includes(ext)) {
        return {
          isCodingRelated: true,
          topic: 'code-exploration',
          domain: cleanDomain
        };
      }
    }
    
    // Check for common coding-related subdomains
    const codingSubdomains = ['api.', 'docs.', 'developer.', 'dev.', 'git.', 'code.', 'www.'];
    for (const subdomain of codingSubdomains) {
      if (cleanDomain.startsWith(subdomain)) {
        const baseDomain = cleanDomain.substring(subdomain.length);
        if (codingDomains[baseDomain]) {
          return {
            isCodingRelated: true,
            topic: codingDomains[baseDomain],
            domain: baseDomain
          };
        }
      }
    }
    
    // Default: not coding related
    return {
      isCodingRelated: false,
      topic: null,
      domain: cleanDomain
    };
    
  } catch (error) {
    // If URL parsing fails, return not coding related
    return {
      isCodingRelated: false,
      topic: null,
      domain: url
    };
  }
}

/**
 * Processes a list of URLs and returns classification results
 * @param urls Array of URLs to classify
 * @returns Array of classification results
 */
export function classifyUrls(urls: string[]): UrlClassificationResult[] {
  return urls.map(url => classifyUrl(url));
}

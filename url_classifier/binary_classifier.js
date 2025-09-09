import { GoogleGenAI } from '@google/genai';

// Initialize Vertex with your Cloud project and location
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'tum-cdtm25mun-8774',
  location: 'global'
});
const model = 'gemini-2.5-flash';


// Set up generation config
const generationConfig = {
  maxOutputTokens: 65535,
  temperature: 1,
  topP: 0.95,
  seed: 0,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    }
  ],
  systemInstruction: {
    parts: [{"text": `You are an expert at classifying websites. Your task is to analyze a given URL and perform two actions:
1.  Determine if the website is related to programming.
2.  If it is programming-related, identify the specific topic.

Respond with a JSON object containing two keys:
- "is_programming_related": a boolean value.
- "programming_topic": a string describing the topic if it's programming-related, otherwise it must be null.

Topics should be concise. Examples include "Web Development", "Data Science", "Algorithms & Data Structures", "DevOps", "Game Development", "Mobile Development", "API Client", etc.

Here are some examples:

**Example 1:**
- **Input:**
  - url: "https://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-processing-an-unsorted-array"
- **Output:**
  \`\`\`json
  {
    "is_programming_related": true,
    "programming_topic": "System Performance & Optimization"
  }`}]
  },
};


async function generateContent() {
  const req = {
    model: model,
    contents: [
      {role: 'user', parts: [{text: `Prompt ######################################################################`}]}
    ],
    config: generationConfig,
  };

  const streamingResp = await ai.models.generateContentStream(req);

  for await (const chunk of streamingResp) {
    if (chunk.text) {
      process.stdout.write(chunk.text);
    } else {
      process.stdout.write(JSON.stringify(chunk) + '\n');
    }
  }
}

generateContent();
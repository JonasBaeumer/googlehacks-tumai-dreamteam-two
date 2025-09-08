from google import genai
from google.genai import types
import base64

def generate(prompt="Hello."):
  client = genai.Client(
      vertexai=True,
      project="tum-cdtm25mun-8774",
      location="global",
  )
  
  prompt = prompt
  text1 = types.Part.from_text(text=prompt)
  si_text1 = """You are an expert at classifying websites. Your task is to analyze a given URL and perform two actions:
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
  ```json
  {
    "is_programming_related": true,
    "programming_topic": "System Performance & Optimization"
  }"""

  model = "gemini-2.5-flash"
  contents = [
    types.Content(
      role="user",
      parts=[
        text1
      ]
    )
  ]
  tools = [
    types.Tool(google_search=types.GoogleSearch()),
  ]

  generate_content_config = types.GenerateContentConfig(
    temperature = 1,
    top_p = 1,
    seed = 0,
    max_output_tokens = 65535,
    safety_settings = [types.SafetySetting(
      category="HARM_CATEGORY_HATE_SPEECH",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_HARASSMENT",
      threshold="OFF"
    )],
    tools = tools,
    system_instruction=[types.Part.from_text(text=si_text1)],
    thinking_config=types.ThinkingConfig(
      thinking_budget=-1,
    ),
  )

  for chunk in client.models.generate_content_stream(
    model = model,
    contents = contents,
    config = generate_content_config,
    ):
    if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
        continue
    print(chunk.text, end="")

# user_prompt = input("Enter your prompt: ")

user_prompt = """- domain: leetcode.com
-path: /questions/53939205/how-to-avoid-extension-context-invalidated-errors-when-messaging-after-an-exte"""

generate(prompt=user_prompt)

print("\n\n")

user_prompt = """- domain: https://www.tagesschau.de
-path:/ausland/europa/frankreich-nach-vertrauensvotum-faq-100.html"""


generate(prompt=user_prompt)
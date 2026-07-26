export async function performOpenAIAnalysis(type, photosArray, answers, apiKey) {
  const systemPrompt = `You are a professional board-certified dermatologist and natural hair expert aesthetician.
Analyze the user's uploaded close-up diagnostic photos representing multiple skin/hair zones (Zone 1: Roots/T-Zone, Zone 2: Shaft/U-Zone, Zone 3: Ends/Eyes) and quiz answers.
Return a professional-grade, highly accurate JSON analysis report matching the requested schema. Make sure your estimations of scores (0-100) and concern comments are realistic and based on the provided image details (pores, texture, redness, curl pattern, etc).`;

  const userPrompt = `
Scan Type: ${type}
Quiz Answers: ${JSON.stringify(answers)}
Please respond ONLY with a raw JSON object containing the analysis report. Do not include markdown formatting or backticks.

JSON Schema for skin:
{
  "type": "skin",
  "metrics": {
    "type": "Dry" | "Oily" | "Combination" | "Sensitive",
    "fitzpatrick": "Type I" | "Type II" | "Type III" | "Type IV" | "Type V" | "Type VI",
    "sunSensitivity": "Low" | "Moderate" | "High",
    "undertone": "Warm" | "Cool" | "Neutral",
    "scores": {
      "hydration": 0-100,
      "pores": 0-100,
      "texture": 0-100,
      "acne": 0-100,
      "redness": 0-100,
      "pigmentation": 0-100,
      "wrinkles": 0-100,
      "eyebags": 0-100,
      "darkCircles": 0-100
    }
  },
  "primaryConcern": { "name": string, "desc": string },
  "routine": {
    "title": string,
    "steps": [
      { "name": string, "desc": string }
    ]
  },
  "productIds": ["s1", "s2", "s3", "s4", "s5"], (Choose 2-3 most matching IDs based on their skin conditions)
  "herbalRecommendations": [string, string, string], (3 organic, plant-based treatments)
  "medicalRecommendations": [string, string, string] (3 clinical, OTC active treatments)
}

JSON Schema for hair:
{
  "type": "hair",
  "metrics": {
    "type": "1A" | "1B" | "1C" | "2A" | "2B" | "2C" | "3A" | "3B" | "3C" | "4A" | "4B" | "4C" (Estimate specific curl pattern),
    "texture": "Fine" | "Medium" | "Coarse",
    "porosity": "Low" | "Medium" | "High",
    "scores": {
      "frizziness": 0-100,
      "damage": 0-100,
      "density": 0-100
    }
  },
  "primaryConcern": { "name": string, "desc": string },
  "routine": {
    "title": string,
    "steps": [
      { "name": string, "desc": string }
    ]
  },
  "productIds": ["h1", "h2", "h3", "h4", "h5"], (Choose 2-3 most matching IDs based on their hair conditions)
  "herbalRecommendations": [string, string, string], (3 organic, plant-based scalp/hair treatments)
  "medicalRecommendations": [string, string, string] (3 clinical, OTC active treatments)
}
`;

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  const contentArray = [
    { type: "text", text: userPrompt }
  ];

  if (photosArray && photosArray.length > 0) {
    photosArray.forEach(base64Image => {
      contentArray.push({
        type: "image_url",
        image_url: {
          url: base64Image
        }
      });
    });
  }

  messages.push({ role: "user", content: contentArray });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenAI API request failed");
  }

  const result = await response.json();
  const rawText = result.choices[0].message.content.trim();
  const report = JSON.parse(rawText);
  report.timestamp = new Date().toISOString();
  
  return report;
}

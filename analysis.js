import { products, routines } from './data.js';

/**
 * Analyzes pixel data from an image canvas to generate realistic visual metrics.
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Image-derived features
 */
export function analyzeCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return getDefaultVisualMetrics();

  try {
    // Sample a 100x100 grid in the center for quick pixel analysis
    const size = Math.min(100, canvas.width, canvas.height);
    const startX = Math.floor((canvas.width - size) / 2);
    const startY = Math.floor((canvas.height - size) / 2);
    const imgData = ctx.getImageData(startX, startY, size, size);
    const data = imgData.data;

    let rSum = 0, gSum = 0, bSum = 0;
    let brightnessSum = 0;
    let varianceSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      
      rSum += r;
      gSum += g;
      bSum += b;
      
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      brightnessSum += brightness;
    }

    const totalPixels = data.length / 4;
    const rAvg = rSum / totalPixels;
    const gAvg = gSum / totalPixels;
    const bAvg = bSum / totalPixels;
    const brightnessAvg = brightnessSum / totalPixels;

    // Calculate variance (rough texture indicator)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      varianceSum += Math.abs(brightness - brightnessAvg);
    }
    const varianceAvg = varianceSum / totalPixels;

    // Determine features
    const rednessRatio = rAvg / (gAvg + bAvg + 1); // high means red skin/irritation
    const undertone = (rAvg > bAvg) ? "warm" : "cool";

    return {
      redness: Math.min(100, Math.max(10, Math.round(rednessRatio * 45))),
      texture: Math.min(100, Math.max(15, Math.round(varianceAvg * 2.2))),
      brightness: Math.min(100, Math.max(10, Math.round(brightnessAvg / 2.55))),
      undertone
    };
  } catch (e) {
    console.warn("Pixel analysis failed (e.g. cross-origin image), using defaults:", e);
    return getDefaultVisualMetrics();
  }
}

function getDefaultVisualMetrics() {
  return {
    redness: 35,
    texture: 42,
    brightness: 68,
    undertone: "warm"
  };
}

/**
 * Performs complete Skin or Hair Analysis.
 * @param {string} type - 'skin' | 'hair'
 * @param {HTMLCanvasElement|null} canvas - Canvas containing the captured image
 * @param {Object} answers - Survey answers
 * @returns {Object} Complete analysis report
 */
export function performAnalysis(type, canvas, answers) {
  const visual = canvas ? analyzeCanvas(canvas) : getDefaultVisualMetrics();
  
  if (type === 'skin') {
    return analyzeSkin(visual, answers);
  } else {
    return analyzeHair(visual, answers);
  }
}

function analyzeSkin(visual, answers) {
  // Answers mapping:
  // skinFeeling: 'oily' | 'dry' | 'combination' | 'sensitive'
  // skinSun: 'type1_2' | 'type3_4' | 'type5_6'
  // skinConcern: 'acne' | 'pigmentation' | 'wrinkles' | 'redness'
  
  const skinType = answers.skinFeeling || 'combination';
  
  // Base scores
  let hydration = 75;
  let pores = 45;
  let acne = 20;
  let redness = visual.redness;
  let pigmentation = 30;
  let wrinkles = 15;
  let eyebags = 25;
  let darkCircles = 30;
  
  // Modifiers based on skin type
  if (skinType === 'dry') {
    hydration = 35;
    wrinkles += 15;
  } else if (skinType === 'oily') {
    hydration = 85;
    pores += 30;
    acne += 25;
  } else if (skinType === 'combination') {
    hydration = 60;
    pores += 15;
    acne += 10;
  } else if (skinType === 'sensitive') {
    hydration = 50;
    redness += 25;
  }

  // Modifiers based on concern
  const concern = answers.skinConcern;
  if (concern === 'acne') {
    acne = Math.min(95, acne + 35);
    pores = Math.min(90, pores + 20);
  } else if (concern === 'pigmentation') {
    pigmentation = Math.min(95, pigmentation + 40);
    darkCircles = Math.min(90, darkCircles + 25);
  } else if (concern === 'wrinkles') {
    wrinkles = Math.min(95, wrinkles + 45);
    eyebags = Math.min(85, eyebags + 25);
  } else if (concern === 'redness') {
    redness = Math.min(95, redness + 35);
  }

  // Calculate Fitzpatrick Type
  let fitzpatrick = "Type III";
  let sunSensitivity = "Moderate";
  if (answers.skinSun === 'type1_2') {
    fitzpatrick = "Type II";
    sunSensitivity = "High";
  } else if (answers.skinSun === 'type5_6') {
    fitzpatrick = "Type V";
    sunSensitivity = "Low";
  }

  // Calculate texture score (blend image variance and dry/oily factors)
  let finalTexture = Math.round((visual.texture * 0.6) + (pores * 0.4));
  finalTexture = Math.min(100, Math.max(10, finalTexture));

  // Determine key skin condition
  const conditions = [
    { name: "Pores", score: pores },
    { name: "Acne", score: acne },
    { name: "Redness", score: redness },
    { name: "Pigmentation", score: pigmentation },
    { name: "Wrinkles", score: wrinkles },
    { name: "Dark Circles", score: darkCircles }
  ];
  
  // Sort conditions to find the highest score
  const primaryConcern = [...conditions].sort((a, b) => b.score - a.score)[0];

  // Get matching routine
  const routine = routines.skin[skinType] || routines.skin.combination;

  // Filter products based on skin type and issues
  const recommendedProducts = products.skin.filter(prod => {
    const matchesType = prod.skinTypes.includes(skinType);
    const matchesCondition = prod.conditions.some(cond => {
      if (cond === 'hydration' && hydration < 60) return true;
      if (cond === 'pores' && pores > 50) return true;
      if (cond === 'acne' && acne > 30) return true;
      if (cond === 'redness' && redness > 45) return true;
      if (cond === 'pigmentation' && pigmentation > 40) return true;
      if (cond === 'wrinkles' && wrinkles > 30) return true;
      return false;
    });
    return matchesType || matchesCondition;
  }).slice(0, 3);

  return {
    type: 'skin',
    timestamp: new Date().toISOString(),
    metrics: {
      type: skinType.charAt(0).toUpperCase() + skinType.slice(1),
      fitzpatrick,
      sunSensitivity,
      undertone: visual.undertone.charAt(0).toUpperCase() + visual.undertone.slice(1),
      scores: {
        hydration,
        pores,
        texture: finalTexture,
        acne,
        redness,
        pigmentation,
        wrinkles,
        eyebags,
        darkCircles
      }
    },
    primaryConcern,
    routine,
    products: recommendedProducts
  };
}

function analyzeHair(visual, answers) {
  // Answers mapping:
  // hairWashing: 'low' | 'medium' | 'high' (porosity indicator)
  // hairStrands: 'type1' | 'type2' | 'type3' | 'type4' (curl pattern)
  // hairThickness: 'fine' | 'medium' | 'coarse' (texture)
  // hairConcern: 'frizziness' | 'density' | 'damage'

  // Porosity mapping
  const porosity = answers.hairWashing === 'high' ? 'high' : 
                   answers.hairWashing === 'low' ? 'low' : 'medium';
  
  // Curl Pattern (Type)
  let curlPattern = "3B";
  if (answers.hairStrands === 'type1') curlPattern = "1B";
  else if (answers.hairStrands === 'type2') curlPattern = "2B";
  else if (answers.hairStrands === 'type3') curlPattern = "3B";
  else if (answers.hairStrands === 'type4') curlPattern = "4C";

  // Texture
  const texture = answers.hairThickness || 'medium';

  // Issue scores (0-100)
  let frizziness = 30;
  let damage = 20;
  let density = 70; // 100 is high density (good)

  // Apply survey adjustments
  if (porosity === 'high') {
    damage += 25;
    frizziness += 30;
  } else if (porosity === 'low') {
    frizziness += 10;
  }

  const concern = answers.hairConcern;
  if (concern === 'frizziness') {
    frizziness = Math.min(95, frizziness + 40);
  } else if (concern === 'damage') {
    damage = Math.min(95, damage + 45);
  } else if (concern === 'density') {
    density = Math.max(15, density - 35);
  }

  // Visual adjustment (e.g. redness/brightness could affect score)
  if (visual.brightness > 75) {
    // Highly reflective hair, lower frizziness score
    frizziness = Math.max(10, frizziness - 15);
  }

  // Select routine based on porosity
  let routineKey = 'mediumPorosity';
  if (porosity === 'high') routineKey = 'highPorosity';
  if (porosity === 'low') routineKey = 'lowPorosity';
  const routine = routines.hair[routineKey];

  // Filter products
  const recommendedProducts = products.hair.filter(prod => {
    const matchesPorosity = prod.porosity.includes(porosity);
    const matchesType = prod.hairTypes.some(type => curlPattern.startsWith(type.charAt(0)));
    const matchesIssue = prod.issues.some(iss => {
      if (iss === 'frizziness' && frizziness > 45) return true;
      if (iss === 'damage' && damage > 35) return true;
      if (iss === 'density' && density < 60) return true;
      return false;
    });
    return (matchesPorosity && matchesType) || matchesIssue;
  }).slice(0, 3);

  return {
    type: 'hair',
    timestamp: new Date().toISOString(),
    metrics: {
      type: curlPattern,
      porosity: porosity.charAt(0).toUpperCase() + porosity.slice(1) + " Porosity",
      texture: texture.charAt(0).toUpperCase() + texture.slice(1),
      scores: {
        frizziness,
        damage,
        density
      }
    },
    primaryConcern: {
      name: concern ? concern.charAt(0).toUpperCase() + concern.slice(1) : "General Care",
      score: concern === 'density' ? 100 - density : 
             concern === 'damage' ? damage : frizziness
    },
    routine,
    products: recommendedProducts
  };
}

/**
 * Sends base64 image and questionnaire to OpenAI API using gpt-4o-mini vision model.
 * Returns professional diagnostic results in a structured format.
 */
export async function performOpenAIAnalysis(type, canvas, answers, apiKey) {
  let base64Image = null;
  if (canvas) {
    try {
      base64Image = canvas.toDataURL("image/jpeg", 0.7);
    } catch (e) {
      console.warn("Canvas toDataURL failed (possibly tainted canvas), continuing with survey data only:", e);
    }
  }

  const systemPrompt = `You are a professional board-certified dermatologist and natural hair expert aesthetician.
Analyze the user's uploaded close-up diagnostic photo and quiz answers.
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
  "productIds": ["s1", "s2", "s3", "s4", "s5"] (Choose 2-3 most matching IDs based on their skin conditions)
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
  "productIds": ["h1", "h2", "h3", "h4", "h5"] (Choose 2-3 most matching IDs based on their hair conditions)
}
`;

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  const contentArray = [
    { type: "text", text: userPrompt }
  ];

  if (base64Image) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: base64Image
      }
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


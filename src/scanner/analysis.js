import { products, routines } from '../../data.js';

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

  let herbalRecommendations = [
    "Apply organic Aloe Vera gel to soothe and cool the skin barrier.",
    "Rinse skin with Green Tea extract to deliver calming antioxidants.",
    "Use a pure Honey wash to provide natural antibacterial hydration."
  ];
  let medicalRecommendations = [
    "Cleanse daily with a pH-balanced, non-comedogenic gentle wash.",
    "Apply a broad-spectrum mineral sunscreen SPF 30+ every morning.",
    "Consult with a board-certified dermatologist for tailored prescription care."
  ];

  if (primaryConcern.name === "Acne") {
    herbalRecommendations = [
      "Use diluted Tea Tree Oil (diluted in jojoba oil) directly on blemishes.",
      "Apply raw Honey mask for 10 minutes to act as a natural antibacterial.",
      "Wipe face with witch hazel extract (alcohol-free) to control sebum."
    ];
    medicalRecommendations = [
      "Use a Salicylic Acid (2%) cleanser daily to clear clogged pores.",
      "Apply Benzoyl Peroxide (2.5%) spot treatment to clear active pustules.",
      "Consider a mild retinol or adapalene gel at night to promote cell turnover."
    ];
  } else if (primaryConcern.name === "Redness" || skinType === "sensitive") {
    herbalRecommendations = [
      "Apply Chamomile or Calendula botanical extracts to calm irritation.",
      "Use an Oatmeal paste mask to soothe itchy, sensitive skin patches.",
      "Apply pure Aloe Vera gel directly from the leaf to cool hot skin."
    ];
    medicalRecommendations = [
      "Apply Ceramide-rich barrier creams to rebuild cuticular lipids.",
      "Avoid all physical scrubs, AHAs/BHAs, and drying denatured alcohols.",
      "Consult a doctor to screen for clinical rosacea or contact dermatitis."
    ];
  } else if (primaryConcern.name === "Pigmentation") {
    herbalRecommendations = [
      "Apply Rosehip seed oil at night to promote skin brightening naturally.",
      "Use Licorice root extract toner to fade dark patches over time.",
      "Incorporate green tea extract to reduce UV-induced pigment triggers."
    ];
    medicalRecommendations = [
      "Use topical Niacinamide or Vitamin C serums in the morning.",
      "Apply a high SPF 50 mineral sunscreen daily to block UV melanin activation.",
      "Look into Alpha Arbutin or Azelaic Acid clinical treatments."
    ];
  } else if (primaryConcern.name === "Wrinkles") {
    herbalRecommendations = [
      "Massage face with Argan oil to deeply moisturize and reduce dryness.",
      "Apply Ginseng root extract to stimulate local microcirculation.",
      "Incorporate Gotu Kola (Centella Asiatica) to support collagen integrity."
    ];
    medicalRecommendations = [
      "Use Retinol (0.5% - 1%) at night to stimulate skin collagen synthesis.",
      "Layer Hyaluronic Acid serum under moisturizer to instantly plump lines.",
      "Use copper peptides or vitamin C serums to shield skin from aging oxides."
    ];
  }

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
    products: recommendedProducts,
    herbalRecommendations,
    medicalRecommendations
  };
}

function analyzeHair(visual, answers) {
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

  let herbalRecommendations = [
    "Massage Aloe Vera gel to calm the scalp and lock moisture into cuticles.",
    "Use Apple Cider Vinegar dilution as a final rinse to balance pH.",
    "Apply Jojoba or Argan oil to seal split ends and prevent dryness."
  ];
  let medicalRecommendations = [
    "Wash weekly with a sulfate-free hydrating cleanser.",
    "Apply a clinical leave-in protein conditioner to build strength.",
    "Avoid chemical relaxers, texturizers, and extreme heat styling."
  ];

  if (concern === 'damage' || porosity === 'high') {
    herbalRecommendations = [
      "Massage warm organic Castor Oil and Coconut Oil into hair shafts weekly.",
      "Apply Avocado and raw Honey mask for 20 minutes to repair fiber lipids.",
      "Rinse with Rosemary tea infusion to help strengthen weakened shafts."
    ];
    medicalRecommendations = [
      "Use hydrolyzed vegetable protein or keratin treatments twice monthly.",
      "Incorporate clinical bond-building shampoo/conditioner routines.",
      "Trim split ends every 6-8 weeks to prevent progressive shaft peeling."
    ];
  } else if (concern === 'frizziness') {
    herbalRecommendations = [
      "Apply pure Aloe Vera gel or Flaxseed gel to wet strands to flatten cuticles.",
      "Perform a warm Olive Oil pre-wash treatment to insulate hair from humidity.",
      "Rinse with Chamomile tea to smooth strands and enhance cuticle reflection."
    ];
    medicalRecommendations = [
      "Use cationic-active leave-in humectants to seal hair cuticles.",
      "Apply lightweight silicone or polymer anti-humidity serums before styling.",
      "Dry hair using a microfiber towel or a cool ionic diffuser."
    ];
  } else if (concern === 'density') {
    herbalRecommendations = [
      "Apply diluted Rosemary essential oil in pumpkin seed carrier oil daily.",
      "Massage Peppermint oil dilution into the scalp to stimulate local circulation.",
      "Rinse scalp with Stinging Nettle infusion to support hair follicle energy."
    ];
    medicalRecommendations = [
      "Apply topical Minoxidil (2% or 5%) solution if diagnosed with thinning.",
      "Massage clinical copper peptide scalp serums into roots daily.",
      "Consider visiting a trichologist to verify iron, Vitamin D, or hormonal status."
    ];
  }

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
    products: recommendedProducts,
    herbalRecommendations,
    medicalRecommendations
  };
}

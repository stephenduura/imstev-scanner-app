export const products = {
  skin: [
    {
      id: "s1",
      name: "Hydrating Hyaluronic Serum",
      brand: "Imstev Skincare",
      category: "Serum",
      price: "$45.00",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80",
      description: "Deeply hydrates the skin, plumping fine lines and improving texture.",
      skinTypes: ["dry", "combination", "sensitive"],
      conditions: ["hydration", "texture", "wrinkles"]
    },
    {
      id: "s2",
      name: "Clarifying Salicylic Cleanser",
      brand: "Imstev Skincare",
      category: "Cleanser",
      price: "$32.00",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80",
      description: "Gently exfoliates pores, controls excess oil, and prevents breakouts.",
      skinTypes: ["oily", "combination"],
      conditions: ["pores", "acne", "texture"]
    },
    {
      id: "s3",
      name: "Niacinamide Glowing Toner",
      brand: "Imstev Skincare",
      category: "Toner",
      price: "$28.00",
      image: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=300&q=80",
      description: "Evens out skin tone, reduces redness, and diminishes dark spots.",
      skinTypes: ["oily", "dry", "combination", "sensitive"],
      conditions: ["redness", "pigmentation", "pores"]
    },
    {
      id: "s4",
      name: "Ceramide Barrier Cream",
      brand: "Imstev Skincare",
      category: "Moisturizer",
      price: "$50.00",
      image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=300&q=80",
      description: "Restores and strengthens the natural skin barrier, soothing sensitivity.",
      skinTypes: ["dry", "sensitive"],
      conditions: ["hydration", "redness"]
    },
    {
      id: "s5",
      name: "Brightening Eye Cream",
      brand: "Imstev Skincare",
      category: "Eye Care",
      price: "$38.00",
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=300&q=80",
      description: "Reduces dark circles, minimizes under-eye puffiness, and smooths wrinkles.",
      skinTypes: ["oily", "dry", "combination", "sensitive"],
      conditions: ["dark circles", "eyebags", "wrinkles"]
    }
  ],
  hair: [
    {
      id: "h1",
      name: "Coily & Curly Moisture Shampoo",
      brand: "Imstev Organics",
      category: "Shampoo",
      price: "$24.00",
      image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=300&q=80",
      description: "Sulfate-free hydrating wash formulated for delicate curl patterns.",
      hairTypes: ["3A", "3B", "3C", "4A", "4B", "4C"],
      porosity: ["high", "medium"],
      issues: ["frizziness", "damage"]
    },
    {
      id: "h2",
      name: "Shea Butter Deep Treatment Mask",
      brand: "Imstev Organics",
      category: "Treatment",
      price: "$34.00",
      image: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=300&q=80",
      description: "Intense moisture infusion for low and high porosity natural curls.",
      hairTypes: ["3B", "3C", "4A", "4B", "4C"],
      porosity: ["high", "low"],
      issues: ["damage", "density"]
    },
    {
      id: "h3",
      name: "Lightweight Rosewater Leave-In",
      brand: "Imstev Organics",
      category: "Leave-In",
      price: "$22.00",
      image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=300&q=80",
      description: "Hydrates hair shafts without weighing down fine to medium curls.",
      hairTypes: ["2A", "2B", "2C", "3A", "3B", "3C"],
      porosity: ["low", "medium"],
      issues: ["frizziness"]
    },
    {
      id: "h4",
      name: "Scalp Stimulating Castor Oil",
      brand: "Imstev Organics",
      category: "Oil",
      price: "$18.00",
      image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=300&q=80",
      description: "Locks in moisture and stimulates follicles to improve hair density.",
      hairTypes: ["3A", "3B", "3C", "4A", "4B", "4C"],
      porosity: ["high", "medium"],
      issues: ["density", "damage"]
    },
    {
      id: "h5",
      name: "Smoothing Silk Protein Cream",
      brand: "Imstev Organics",
      category: "Styling",
      price: "$26.00",
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=300&q=80",
      description: "Defines curls, combats frizz, and strengthens high porosity hair.",
      hairTypes: ["2C", "3A", "3B", "3C", "4A", "4B", "4C"],
      porosity: ["high"],
      issues: ["frizziness", "damage"]
    }
  ]
};

export const routines = {
  skin: {
    dry: {
      title: "Moisture Replenishing Routine",
      steps: [
        { name: "Cleanse", desc: "Use a gentle, non-foaming hydrating milk cleanser." },
        { name: "Tone", desc: "Apply Niacinamide Glowing Toner while skin is damp." },
        { name: "Treat", desc: "Apply 3-4 drops of Hydrating Hyaluronic Serum." },
        { name: "Moisturize", desc: "Massage Ceramide Barrier Cream over face and neck." },
        { name: "Protect", desc: "Finish with a hydrating mineral SPF 30+ in the morning." }
      ]
    },
    oily: {
      title: "Matte & Clarify Routine",
      steps: [
        { name: "Cleanse", desc: "Wash with Clarifying Salicylic Cleanser." },
        { name: "Tone", desc: "Apply Niacinamide Glowing Toner to balance sebum." },
        { name: "Treat", desc: "Apply Niacinamide or light zinc serum." },
        { name: "Moisturize", desc: "Use a lightweight, oil-free gel moisturizer." },
        { name: "Protect", desc: "Apply a matte, non-comedogenic SPF 30+." }
      ]
    },
    combination: {
      title: "Balance & Zone Control Routine",
      steps: [
        { name: "Cleanse", desc: "Cleanse zones with a gentle pH-balanced foaming wash." },
        { name: "Tone", desc: "Sweep Niacinamide Toner, concentrating on the oily T-zone." },
        { name: "Treat", desc: "Use Hyaluronic Acid on cheeks, Salicylic Acid on oily spots." },
        { name: "Moisturize", desc: "Layer a light lotion, adding extra cream to dry spots." }
      ]
    },
    sensitive: {
      title: "Barrier Calming Routine",
      steps: [
        { name: "Cleanse", desc: "Wash with lukewarm water and a soap-free calming cleanser." },
        { name: "Tone", desc: "Pat Niacinamide Glowing Toner gently onto skin." },
        { name: "Moisturize", desc: "Apply a generous layer of Ceramide Barrier Cream." },
        { name: "Soothe", desc: "Avoid all harsh exfoliators (AHAs/BHAs) and active alcohols." }
      ]
    }
  },
  hair: {
    lowPorosity: {
      title: "Heat-Assisted Hydration Routine",
      steps: [
        { name: "Clarify", desc: "Wash with warm water to open the stubborn hair cuticles." },
        { name: "Condition", desc: "Apply a lightweight conditioner, detangling gently with fingers." },
        { name: "Steam", desc: "Apply Shea Butter Deep Treatment Mask, cover with a plastic cap, and apply mild heat for 15 minutes." },
        { name: "Hydrate", desc: "Apply Lightweight Rosewater Leave-In while hair is warm and wet." },
        { name: "Seal", desc: "Use a small amount of a light oil (like almond or jojoba oil) to seal moisture without buildup." }
      ]
    },
    highPorosity: {
      title: "Cuticle Flattening & Lock Routine",
      steps: [
        { name: "Wash", desc: "Wash with Coily & Curly Moisture Shampoo using cool/lukewarm water." },
        { name: "Treat", desc: "Apply Shea Butter Deep Treatment Mask for structural repair." },
        { name: "Rinse", desc: "Rinse with cool water to encourage hair cuticles to close." },
        { name: "L.O.C. Method", desc: "Apply Rosewater Leave-In, seal with Castor Oil, then layer with Smoothing Silk Protein Cream." }
      ]
    },
    mediumPorosity: {
      title: "Maintenance & Shine Routine",
      steps: [
        { name: "Cleanse", desc: "Wash weekly with a sulfate-free hydrating shampoo." },
        { name: "Hydrate", desc: "Apply conditioner and leave in for 5 minutes before rinsing." },
        { name: "Moisturize", desc: "Mist Lightweight Rosewater Leave-In evenly." },
        { name: "Style", desc: "Define curls using a styling cream or gel as desired." }
      ]
    }
  }
};

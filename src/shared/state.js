export const state = {
  hasSession: false,
  profile: { name: "", age: "25-34", gender: "", baselineHair: "none", baselineSkin: "none" },
  history: [],
  clients: [],
  selectedClient: null,
  activeScanType: null, // 'hair' | 'skin'
  capturedZones: [],
  scannerZoneIndex: 0
};

export const surveys = {
  hair: [
    {
      question: "How does your hair behave after washing?",
      desc: "This helps estimate your hair porosity (moisture absorption).",
      key: "hairWashing",
      options: [
        { label: "Dries slowly, products sit on top", value: "low" },
        { label: "Dries in average time, absorbs product easily", value: "medium" },
        { label: "Dries very fast, feels dry/thirsty quickly", value: "high" }
      ]
    },
    {
      question: "What shape do your strands form?",
      desc: "Select your primary curl pattern.",
      key: "hairStrands",
      options: [
        { label: "Straight, completely flat", value: "type1" },
        { label: "Wavy, loose S-shape", value: "type2" },
        { label: "Curly, springy ringlets/spirals", value: "type3" },
        { label: "Coily, tight zig-zag or kinks", value: "type4" }
      ]
    },
    {
      question: "How thick is a single strand of your hair?",
      desc: "This determines your hair texture.",
      key: "hairThickness",
      options: [
        { label: "Fine (hardly felt, transparent in light)", value: "fine" },
        { label: "Medium (standard thread feel)", value: "medium" },
        { label: "Coarse (thick, wiry, strong)", value: "coarse" }
      ]
    },
    {
      question: "What is your main hair concern?",
      desc: "We will tailor product recommendations to this.",
      key: "hairConcern",
      options: [
        { label: "Frizziness & lack of definition", value: "frizziness" },
        { label: "Dryness, damage & split ends", value: "damage" },
        { label: "Thinning, hair loss & low density", value: "density" }
      ]
    }
  ],
  skin: [
    {
      question: "How does your skin feel in the afternoon?",
      desc: "This helps identify your base skin type.",
      key: "skinFeeling",
      options: [
        { label: "Tight, dry, or flaky", value: "dry" },
        { label: "Oily or shiny all over", value: "oily" },
        { label: "Oily in T-zone, dry on cheeks", value: "combination" },
        { label: "Red, irritated, or burning", value: "sensitive" }
      ]
    },
    {
      question: "How easily does your skin burn in the sun?",
      desc: "Helps classify your Fitzpatrick sun sensitivity level.",
      key: "skinSun",
      options: [
        { label: "Always burns easily, rarely/never tans", value: "type1_2" },
        { label: "Burns moderately, tans gradually", value: "type3_4" },
        { label: "Rarely burns, tans deeply and easily", value: "type5_6" }
      ]
    },
    {
      question: "What is your primary skin concern?",
      desc: "We will tailor ingredients and treatments to this.",
      key: "skinConcern",
      options: [
        { label: "Acne, blackheads, or breakouts", value: "acne" },
        { label: "Dark spots, pigmentation, or uneven tone", value: "pigmentation" },
        { label: "Fine lines, wrinkles, or sagging", value: "wrinkles" },
        { label: "Redness, irritation, or broken capillaries", value: "redness" }
      ]
    }
  ]
};

export function clearUserSessionData() {
  state.hasSession = false;
  state.profile = { name: "", age: "25-34", gender: "", baselineHair: "none", baselineSkin: "none" };
  state.history = [];
  localStorage.removeItem('imstev_scan_history');
  localStorage.removeItem('imstev_user_profile');
}

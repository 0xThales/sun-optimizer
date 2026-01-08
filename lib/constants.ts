// UV Index thresholds and risk levels (WHO standard)
// Each level starts at 'min' and goes up to (but not including) the next level's min
// Low: 0-2.99, Moderate: 3-5.99, High: 6-7.99, Very High: 8-10.99, Extreme: 11+
export const UV_THRESHOLDS = {
  LOW: { min: 0, max: 3 },        // UV < 3
  MODERATE: { min: 3, max: 6 },   // 3 <= UV < 6
  HIGH: { min: 6, max: 8 },       // 6 <= UV < 8
  VERY_HIGH: { min: 8, max: 11 }, // 8 <= UV < 11
  EXTREME: { min: 11, max: Infinity }, // UV >= 11
} as const

// UV colors for display (Tailwind classes)
export const UV_COLORS = {
  low: {
    bg: "bg-green-500",
    bgLight: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-400/30",
  },
  moderate: {
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-400/30",
  },
  high: {
    bg: "bg-orange-500",
    bgLight: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-400/30",
  },
  "very-high": {
    bg: "bg-red-500",
    bgLight: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-400/30",
  },
  extreme: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-400/30",
  },
} as const

// SPF recommendations by UV level
export const SPF_RECOMMENDATIONS = {
  low: 15,
  moderate: 30,
  high: 30,
  "very-high": 50,
  extreme: 50,
} as const

// Optimal UV range for Vitamin D synthesis without excessive risk
export const OPTIMAL_UV_RANGE = {
  min: 3,
  max: 7,
} as const

// Default location (Madrid, Spain as fallback)
export const DEFAULT_LOCATION = {
  name: "Madrid",
  lat: 40.4168,
  lon: -3.7038,
  country: "ES",
} as const



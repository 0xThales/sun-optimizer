// UV Index thresholds and risk levels
export const UV_THRESHOLDS = {
  LOW: { min: 0, max: 2 },
  MODERATE: { min: 3, max: 5 },
  HIGH: { min: 6, max: 7 },
  VERY_HIGH: { min: 8, max: 10 },
  EXTREME: { min: 11, max: Infinity },
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

// Protection messages by UV level
export const PROTECTION_MESSAGES = {
  low: {
    message: "Bajo riesgo de daño solar",
    precautions: [
      "Uso mínimo de protección",
      "Seguro para exposición prolongada",
    ],
  },
  moderate: {
    message: "Riesgo moderado de daño solar",
    precautions: [
      "Usar protector solar SPF 30",
      "Buscar sombra en horas pico",
      "Usar gafas de sol",
    ],
  },
  high: {
    message: "Alto riesgo de daño solar",
    precautions: [
      "Protector solar SPF 30+ obligatorio",
      "Evitar exposición entre 10am-4pm",
      "Usar sombrero y gafas",
      "Buscar sombra",
    ],
  },
  "very-high": {
    message: "Riesgo muy alto de daño solar",
    precautions: [
      "Evitar exposición solar directa",
      "Protector solar SPF 50",
      "Ropa protectora obligatoria",
      "Permanecer en sombra",
    ],
  },
  extreme: {
    message: "Riesgo extremo de daño solar",
    precautions: [
      "Evitar salir en horas de sol",
      "Protección máxima requerida",
      "Daño ocurre en minutos",
      "Permanezca en interiores si es posible",
    ],
  },
} as const

// Time format options
export const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}

// Default location (Madrid, Spain as fallback)
export const DEFAULT_LOCATION = {
  name: "Madrid",
  lat: 40.4168,
  lon: -3.7038,
  country: "ES",
} as const

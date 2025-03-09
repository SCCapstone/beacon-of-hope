export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export const NUTRITIONAL_RANGES = {
  calories: { min: 0, max: 1000 },
  carbs: { min: 0, max: 100 },
  protein: { min: 0, max: 50 },
  fat: { min: 0, max: 50 },
  fiber: { min: 0, max: 30 },
  glycemicIndex: { min: 0, max: 100 },
} as const;

export const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
] as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const COLOR_SCHEMES = {
  meal: {
    breakfast: "#FF9F1C",
    lunch: "#2EC4B6",
    dinner: "#E71D36",
    snack: "#7209B7",
  },
  food: {
    main_course: "#3D5A80",
    side_dish: "#98C1D9",
    beverage: "#E0FBFC",
    dessert: "#EE6C4D",
    snack: "#293241",
  },
  ingredient: {
    protein: "#FF595E",
    carbs: "#FFCA3A",
    vegetable: "#8AC926",
    fruit: "#1982C4",
    dairy: "#6A4C93",
    fat: "#F15BB5",
    spice: "#9B5DE5",
    sauce: "#00BBF9",
  },
} as const;

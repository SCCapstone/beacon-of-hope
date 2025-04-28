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

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  nutritionalInfo: NutritionalInfo;
  allergens: string[];
  culturalOrigin?: string[];
  substitutes?: string[];
  diabetesFriendly?: boolean;
}

export interface Food {
  id: string;
  name: string;
  type: 'main_course' | 'side_dish' | 'beverage' | 'dessert' | 'snack';
  ingredients: Ingredient[];
  nutritionalInfo: NutritionalInfo;
  preparationTime: number;
  cookingTime: number;
  instructions: string[];
  culturalOrigin?: string[];
  diabetesFriendly?: boolean;
  allergens: string[];
  tips?: string[]; // Add as optional
}

export interface Meal {
  id: string; // Unique ID for this specific frontend instance (trace or recommendation meal)
  originalBackendId?: string; // Original _id from backend (especially for recommendations)
  name: string; // e.g., "Breakfast", "Lunch", "Snack"
  time: string; // e.g., "08:00" (24-hour format internally)
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; // Category of the meal
  foods: Food[]; // List of foods included in the meal
  nutritionalInfo: NutritionalInfo; // Combined nutrition for the whole meal
  diabetesFriendly?: boolean; // Calculated based on combined nutrition/foods
  culturalTips?: string[]; // Optional tips related to culture
  healthBenefits?: string[]; // Optional health benefits summary
  date?: Date; // Date associated with the meal instance
  varietyScore?: number; // Score from 0 to 1
  coverageScore?: number; // Score from 0 to 1 (item_coverage_score)
  constraintScore?: number; // Score from 0 to 1 (nutritional_constraint_score)
  isFavorited?: boolean;
  mealPlanName?: string;
}

// Represents meals consumed on a specific day (Trace Data)
export interface DayMeals {
  date: Date;
  meals: Meal[]; // List of consumed meals for the day
}

// Represents recommended meals for a specific day
export interface DayRecommendations {
  date: Date;
  recommendations: MealRecommendation[]; // List of recommendations for the day
}

// Represents a single meal recommendation
export interface MealRecommendation {
  meal: Meal; // The recommended Meal object (includes score internally now)
  reasons?: string[]; // Text reasons why it's recommended
  nutritionalImpact: { // Shows the meal's contribution
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  healthBenefits?: string[]; // Specific health benefits text
  varietyScore?: number;
  coverageScore?: number;
  constraintScore?: number;
}


export interface UserPreferences {
  diabetesFriendly: boolean;
  culturalPreferences: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  mealPreferences?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
  };
  foodPreferences?: {
    spicyLevel: number;
    sweetLevel: number;
    preferredCuisines: string[];
  };
  dairyPreference?: number; // e.g., -1 (avoid), 0 (neutral), 1 (prefer)
  meatPreference?: number;
  nutsPreference?: number;
}

export interface UserAnthropometrics {
  age: number;
  weight: number; // Consider units (e.g., kg or lbs)
  height: number; // Consider units (e.g., cm or inches)
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  healthConditions?: string[]; // e.g., ['diabetes_type_2', 'hypertension']
  bloodSugarLevels?: { // Optional
    fasting?: number; // mg/dL or mmol/L
    postPrandial?: number; // mg/dL or mmol/L
  };
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say'; // Add gender if used
}


export interface VisualizationLevel {
  type: 'meal' | 'food' | 'ingredient';
  view: 'calendar' | 'list' | 'comparison';
}

export interface NutritionalGoals {
  dailyCalories: number;
  carbohydrates: {
    daily: number;
    unit: string;
  };
  protein: {
    daily: number;
    unit: string;
  };
  fiber: {
    daily: number;
    unit: string;
  };
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  glycemicIndex?: number;
  glycemicLoad?: number;
  sugarContent?: number;
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
  id: string; // Unique ID for this specific instance (could be trace or recommendation)
  originalBackendId?: string; // Original _id from backend if it's based on a recommendation
  name: string;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  nutritionalInfo: NutritionalInfo;
  diabetesFriendly?: boolean;
  culturalTips?: string[];
  healthBenefits?: string[];
  date?: Date; // Date associated with the meal
}

export interface DayMeals {
  date: Date;
  meals: Meal[];
}

export interface DayRecommendations {
  date: Date;
  recommendations: MealRecommendation[];
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
}

export interface UserAnthropometrics {
  age: number;
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  healthConditions: string[];
  bloodSugarLevels?: {
    fasting: number;
    postPrandial: number;
  };
}

export interface VisualizationLevel {
  type: 'meal' | 'food' | 'ingredient';
  view: 'calendar' | 'list' | 'comparison';
}

export interface FilterOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  mealTypes: string[];
  foodTypes: string[];
  ingredients: string[];
  nutritionalRange: {
    calories?: { min: number; max: number };
    carbs?: { min: number; max: number };
    protein?: { min: number; max: number };
    fat?: { min: number; max: number };
  };
  healthFilters: {
    diabetesFriendly: boolean;
    culturalPreference: string[];
    allergenFree: string[];
  };
}

export interface PatternAnalysis {
  type: 'ingredient' | 'food' | 'meal';
  frequency: number;
  timePattern?: string;
  dayPattern?: string[];
  correlation?: {
    with: string;
    strength: number;
    type: 'positive' | 'negative';
  };
}

export interface MealPattern {
  patterns: PatternAnalysis[];
  recommendations: string[];
  healthInsights: {
    diabetesImpact: string;
    culturalAlignment: string;
    nutritionalBalance: string;
  };
}

export interface ManagementTip {
  mealType: string;
  tips: string[];
}

export interface MealRecommendation {
  meal: Meal;
  score: number; // 0-100 score for how well it matches user preferences
  reasons?: string[]; // Why this meal is recommended
  nutritionalImpact: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  healthBenefits?: string[];
  replacementFor?: {
    mealId: string;
    timeSlot: string;
  };
}
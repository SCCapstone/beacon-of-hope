// types.ts
export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string; // e.g., 'protein', 'carbs', 'vegetable', 'dairy', etc.
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  ingredients: Ingredient[];
}

export interface DayMeals {
  date: string;
  meals: Meal[];
}

export interface MealComparison {
  meal1: Meal | null;
  meal2: Meal | null;
}

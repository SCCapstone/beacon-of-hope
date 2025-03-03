import axios from "axios";
import {
  DayMeals,
  Food,
  NutritionalInfo,
} from "../components/MealTimeline/types";
import { convertTime12to24 } from "../utils/mealPlanTransformer";
import { calculateNutritionalInfo, isDiabetesFriendly } from "../utils/mealPlanTransformer";

const BACKEND_URL = "http://127.0.0.1:8000";

// Define types for API response
// TODO: Might be duplicates
interface MealType {
  beverage?: string;
  main_course?: string;
  side_dish?: string;
  dessert?: string;
}

interface MealData {
  _id: string;
  meal_time: string;
  meal_name: string;
  meal_types: MealType;
}

interface DayData {
  _id: string;
  meals: MealData[];
  user_id: string;
  meal_plan_id: string;
}

interface ApiResponse {
  day_plans: {
    [date: string]: DayData;
  };
}

export async function fetchRecipeInfo(foodId: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/beacon/get-recipe-info/${foodId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe info for ID ${foodId}:`, error);
    throw error;
  }
}

export async function fetchBeverageInfo(bevId: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/beacon/get-beverage-info/${bevId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching beverage info for ID ${bevId}:`, error);
    throw error;
  }
}

export async function fetchMealDays(userId: string, dates: string[]) {
  try {
    const response = await axios.post<ApiResponse>(
      `${BACKEND_URL}/beacon/recommendation/retrieve-days/${userId}`,
      { dates }
    );
    console.log(`\nFetched meal days for ` + dates);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching meal days:", error);
    throw error;
  }
}

// Helper function to generate date strings for a date range
export function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

async function transformFoodInfo(
  foodInfo: any,
  mealType: string,
  foodId: string
): Promise<Food> {
  const ingredients =
    foodInfo.ingredients?.map((ing: any) => ({
      id: (ing.name || ing.ingredient_name).toLowerCase().replace(/\s+/g, "-"),
      name: ing.name || ing.ingredient_name,
      amount: parseFloat(ing.quantity?.measure) || 1,
      unit: ing.quantity?.unit || "unit",
      category: ing.category || "other",
      nutritionalInfo: calculateNutritionalInfo(ing),
      allergens: ing.allergies?.category || [],
      culturalOrigin: foodInfo.cultural_origin || [],
      diabetesFriendly: true, // This could be calculated based on nutritional info
    })) || [];

  const nutritionalInfo = calculateNutritionalInfo(foodInfo);

  return {
    id: foodId,
    name: foodInfo.recipe_name || foodInfo.name,
    type: mealType as
      | "main_course"
      | "side_dish"
      | "beverage"
      | "dessert"
      | "snack",
    ingredients,
    nutritionalInfo,
    diabetesFriendly: isDiabetesFriendly(nutritionalInfo),
    preparationTime: parseInt(foodInfo.prep_time?.split(" ")[0] || "0"),
    cookingTime: parseInt(foodInfo.cook_time?.split(" ")[0] || "0"),
    instructions:
      foodInfo.instructions?.map((inst: any) => inst.original_text) || [],
    culturalOrigin: foodInfo.cultural_origin || [],
    allergens: foodInfo.allergens || [],
  };
}

// Helper function to calculate combined nutritional info
function calculateCombinedNutritionalInfo(foods: Food[]): NutritionalInfo {
  const initial: NutritionalInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    glycemicIndex: 0,
    glycemicLoad: 0,
    sugarContent: 0,
  };

  if (foods.length === 0) return initial;

  const combined = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.nutritionalInfo.calories,
      protein: acc.protein + food.nutritionalInfo.protein,
      carbs: acc.carbs + food.nutritionalInfo.carbs,
      fat: acc.fat + food.nutritionalInfo.fat,
      fiber: acc.fiber + food.nutritionalInfo.fiber,
      sugarContent:
        (acc.sugarContent || 0) + (food.nutritionalInfo.sugarContent || 0),
    }),
    initial
  );

  // Calculate average glycemic index weighted by carb content
  const totalCarbs = foods.reduce(
    (sum, food) => sum + food.nutritionalInfo.carbs,
    0
  );
  const weightedGI = foods.reduce((sum, food) => {
    const gi = food.nutritionalInfo.glycemicIndex || 0;
    return sum + (gi * food.nutritionalInfo.carbs) / totalCarbs;
  }, 0);

  return {
    ...combined,
    glycemicIndex: weightedGI,
    glycemicLoad: Math.round((combined.carbs * weightedGI) / 100),
  };
}

export async function transformApiResponseToDayMeals(
  apiResponse: ApiResponse,
): Promise<DayMeals[]> {
  const dayMeals: DayMeals[] = [];

  for (const [dateStr, dayData] of Object.entries(apiResponse.day_plans)) {
    const dayMeal: DayMeals = {
      date: new Date(dateStr),
      meals: [],
    };

    // Skip if no data for this day
    if (!dayData || !dayData.meals || !Array.isArray(dayData.meals)) {
      dayMeals.push(dayMeal);
      continue;
    }

    // Process each meal in the day
    for (const meal of dayData.meals) {
      try {
        const mealFoods: Food[] = [];

        // Process each meal type (main course, side dish, etc.)
        for (const [mealType, foodId] of Object.entries(meal.meal_types)) {
          if (typeof foodId !== "string") continue;

          try {
            let foodInfo;
            if (mealType === "beverage") {
              foodInfo = await fetchBeverageInfo(foodId);
            } else {
              foodInfo = await fetchRecipeInfo(foodId);
            }

            const transformedFood = await transformFoodInfo(
              foodInfo,
              mealType,
              foodId
            );
            mealFoods.push(transformedFood);
          } catch (error) {
            console.error(`Error fetching food info for ${mealType}:`, error);
          }
        }

        // Calculate combined nutritional info for the meal
        const mealNutritionalInfo = calculateCombinedNutritionalInfo(mealFoods);

        // Add the meal to the day's meals
        dayMeal.meals.push({
          id: `${dateStr}-${meal.meal_name}-${meal._id}`,
          name: `${
            meal.meal_name.charAt(0).toUpperCase() + meal.meal_name.slice(1)
          } Meal`,
          time: convertTime12to24(meal.meal_time),
          type: meal.meal_name as "breakfast" | "lunch" | "dinner" | "snack",
          foods: mealFoods,
          nutritionalInfo: mealNutritionalInfo,
          diabetesFriendly: mealFoods.every((food) => food.diabetesFriendly),
        });
      } catch (error) {
        console.error(`Error processing meal:`, error);
      }
    }

    dayMeals.push(dayMeal);
  }

  return dayMeals;
}

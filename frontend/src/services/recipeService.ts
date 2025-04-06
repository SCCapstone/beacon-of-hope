import axios from "axios";
import {
  DayMeals,
  Food,
  NutritionalInfo,
  Meal,
  NutritionalGoals,
} from "../components/MealTimeline/types";
import {
  calculateNutritionalInfo,
  isDiabetesFriendly,
  getDefaultMealTime,
  extractAllergensFromR3,
  BanditMealData,
} from "../utils/mealPlanTransformer";
import { ApiError } from "../utils/errorHandling";
import { format, parse, startOfDay, isValid as isValidDate } from "date-fns";

const BACKEND_URL = "http://127.0.0.1:8000";
// const mealDataCache = new Map<string, any>();

interface DayData {
  _id: string;
  meals: BanditMealData[];
  user_id: string;
  meal_plan_id: string;
}

interface ApiResponse {
  day_plans: {
    [date: string]: DayData;
  };
  scores?: { // Optional top-level scores
    variety_scores?: number[];
    coverage_scores?: number[];
    constraint_scores?: number[];
};
_id?: string; // meal plan id
user_id?: string;
name?: string;
}

export async function fetchNutritionalGoals(
  userId: string
): Promise<NutritionalGoals | null> {
  if (!userId) {
    console.warn("fetchNutritionalGoals: No userId provided.");
    return null; // Or throw an error, depending on desired behavior
  }
  try {
    const response = await axios.get<{ success: boolean; daily_goals: any }>(
      `${BACKEND_URL}/beacon/user/nutritional-goals/${userId}`
    );
    if (response.data && response.data.success && response.data.daily_goals) {
      // Transform the raw API response to the NutritionalGoals type
      const goalsData = response.data.daily_goals;
      return {
        dailyCalories: goalsData.calories || 2000, // Provide defaults
        carbohydrates: { daily: goalsData.carbs || 250, unit: "g" }, // Store daily total
        protein: { daily: goalsData.protein || 100, unit: "g" }, // Store daily total
        fiber: { daily: goalsData.fiber || 30, unit: "g" },
      };
    } else {
      console.warn(
        "Nutritional goals not found or invalid response for user:",
        userId
      );
      return null; // Return null if goals aren't set or response is bad
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(
        `Nutritional goals not found for user ${userId}. Returning null.`
      );
      return null;
    }
    console.error(
      `Error fetching nutritional goals for user ${userId}:`,
      error
    );
    return null;
  }
}

export async function setNutritionalGoals(
  userId: string,
  goals: { calories: number; carbs: number; protein: number; fiber: number }
): Promise<boolean> {
  if (!userId) {
    console.error("setNutritionalGoals: No userId provided.");
    return false;
  }
  try {
    const response = await axios.post(
      `${BACKEND_URL}/beacon/user/nutritional-goals`,
      {
        user_id: userId,
        daily_goals: goals,
      }
    );
    return response.data?.success === true;
  } catch (error) {
    console.error(`Error setting nutritional goals for user ${userId}:`, error);
    return false;
  }
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
    if (typeof response.data === 'string') {
        return { name: response.data }; // Wrap in an object if needed downstream
    }
    return response.data;
  } catch (error) {
    console.error(`Error fetching beverage info for ID ${bevId}:`, error);
    throw error;
  }
}

export async function fetchMealDays(userId: string, dates: string[]) {
  if (!userId) {
      console.error("fetchMealDays called with no userId.");
      // Return empty structure matching expected success response
      return { day_plans: {} };
  }
  if (!dates || dates.length === 0) {
      console.log("fetchMealDays called with no dates.");
      return { day_plans: {} };
  }

  try {
    console.log(
      `Fetching meal days for user ${userId} on dates: ${dates.join(", ")}`
    );
    const response = await axios.post<ApiResponse>(
      `${BACKEND_URL}/beacon/recommendation/retrieve-days/${userId}`,
      { dates }
    );

    // Check specifically for the day_plans structure
    if (!response.data || typeof response.data.day_plans !== 'object') {
      console.error("Invalid response format from API:", response.data);
      // Return empty structure to prevent downstream errors
      return { day_plans: {} };
    }

    console.log(`Fetched meal days for ${dates.join(", ")}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error fetching meal days: ${error.message}`,
        error.response?.data
      );

      // Handle 404 or 500 potentially indicating no history for the user/dates
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log(`No meal history found for user ${userId} on dates ${dates.join(", ")} (Status: ${error.response?.status}). Returning empty data.`);
        return { day_plans: {} }; // Return empty structure, not an error
      }

      // For other errors, throw a more specific error
      throw new ApiError(
        `Failed to fetch meal data: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    // Handle non-Axios errors
    console.error("Unexpected error fetching meal days:", error);
    throw error; // Re-throw unexpected errors
  }
}

// Helper function to generate date strings for a date range
export function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  let currentDate = new Date(startDate); // Use new Date to avoid modifying original
  currentDate.setHours(0, 0, 0, 0); // Normalize start date

  const finalEndDate = new Date(endDate);
  finalEndDate.setHours(0, 0, 0, 0); // Normalize end date

  if (isNaN(currentDate.getTime()) || isNaN(finalEndDate.getTime())) {
      console.error("generateDateRange received invalid date(s)", startDate, endDate);
      return [];
  }

  while (currentDate <= finalEndDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Helper function to normalize date (ensure it returns a valid Date or throws)
function normalizeAndValidateDate(dateInput: Date | string): Date {
  let dateObj: Date;
  if (typeof dateInput === "string") {
      // Try parsing common formats, prioritize ISO YYYY-MM-DD
      dateObj = parse(dateInput, "yyyy-MM-dd", new Date());
      if (!isValidDate(dateObj)) {
          // Fallback to generic parsing if YYYY-MM-DD fails
          dateObj = new Date(dateInput);
      }
  } else if (dateInput instanceof Date) {
      dateObj = dateInput;
  } else {
      // Handle null/undefined or other invalid types
      console.error("Invalid date input type in normalizeAndValidateDate:", dateInput);
      throw new Error(`Invalid date input type: ${typeof dateInput}`);
  }

  if (!isValidDate(dateObj)) {
    console.error(
      "Invalid date encountered in normalizeAndValidateDate:",
      dateInput
    );
    // Depending on strictness, you might throw an error or return a default
    // For now, let's throw to make issues visible
    throw new Error(`Invalid date format or value: ${dateInput}`);
  }
  return startOfDay(dateObj); // Normalize to local midnight
}

// Helper function to transform food information
async function transformFoodInfo(
  foodInfo: any,
  mealType: string,
  foodId: string // Keep original ID for reference
): Promise<Food> {
  if (!foodInfo) {
    // Return a placeholder or throw error? Let's throw for clarity.
    console.error(`No food info provided for ID ${foodId}, Type ${mealType}`);
    throw new Error(`Missing food info for ${foodId}`);
  }

  const ingredients =
    foodInfo.ingredients?.map((ing: any, index: number) => {
      const ingName = ing.name || ing.ingredient_name || `Unknown Ingredient ${index + 1}`;
      const ingId = (ing.id || ingName).toLowerCase().replace(/\s+/g, "-"); // Generate ID if missing
      return {
        id: ingId,
        name: ingName,
        amount: parseFloat(ing.quantity?.measure) || 1,
        unit: ing.quantity?.unit || "unit",
        category: ing.category || "other",
        nutritionalInfo: calculateNutritionalInfo(ing), // Calculate per ingredient
        allergens: ing.allergies?.category || [],
        culturalOrigin: ing.cultural_origin || foodInfo.cultural_origin || [], // Inherit if needed
        // Diabetes friendliness per ingredient is complex, default or calculate simply
        diabetesFriendly: isDiabetesFriendly(calculateNutritionalInfo(ing)), // Example: check each ingredient
      };
    }) || [];

  const nutritionalInfo = calculateNutritionalInfo(foodInfo); // Calculate for the whole food item

  return {
    id: foodId, // Use the original ID passed in
    name: foodInfo.recipe_name || foodInfo.name || "Unnamed Food",
    type: mealType as
      | "main_course"
      | "side_dish"
      | "beverage"
      | "dessert"
      | "snack",
    ingredients,
    nutritionalInfo,
    // Base overall diabetes friendliness on the whole food item's nutrition
    diabetesFriendly: isDiabetesFriendly(nutritionalInfo),
    preparationTime: parseInt(foodInfo.prep_time?.split(" ")[0] || "0"),
    cookingTime: parseInt(foodInfo.cook_time?.split(" ")[0] || "0"),
    instructions:
      foodInfo.instructions?.map((inst: any) => inst.original_text || inst.text || "") || [],
    culturalOrigin: foodInfo.cultural_origin || [],
    allergens: foodInfo.allergens || extractAllergensFromR3(foodInfo), // Use helper if needed
    // tips: foodInfo.tips || [], // if available
  };
}

// Helper function to calculate combined nutritional info for a meal
function calculateCombinedNutritionalInfo(foods: Food[]): NutritionalInfo {
  const initial: NutritionalInfo = {
    calories: 0, protein: 0, carbs: 0, fiber: 0,
  };

  if (!foods || foods.length === 0) return initial;

  const combined = foods.reduce(
    (acc, food) => {
        const info = food.nutritionalInfo || {}; // Handle potentially missing info
        return {
            calories: acc.calories + (info.calories || 0),
            protein: acc.protein + (info.protein || 0),
            carbs: acc.carbs + (info.carbs || 0),
            fiber: acc.fiber + (info.fiber || 0),
        };
    },
    initial
  );

  return {
    ...combined,
  };
}

// Main transformation function for TRACE data (from retrieve-days)
export async function transformApiResponseToDayMeals(
  apiResponse: ApiResponse
): Promise<DayMeals[]> {
  if (!apiResponse || !apiResponse.day_plans || typeof apiResponse.day_plans !== 'object') {
    console.error("Invalid API response format in transformApiResponseToDayMeals:", apiResponse);
    return [];
  }

  const dayMealsMap = new Map<string, DayMeals>(); // Use map for efficient updates

  // Step 1: Collect all unique food/beverage IDs to fetch
  const foodIdsToFetch = new Map<string, { type: string }>();
  for (const dayData of Object.values(apiResponse.day_plans)) {
    if (!dayData || !Array.isArray(dayData.meals)) continue;
    for (const meal of dayData.meals) {
      for (const [mealType, foodId] of Object.entries(meal.meal_types)) {
        if (typeof foodId === "string" && foodId.trim() !== "") {
          if (!foodIdsToFetch.has(foodId)) {
            foodIdsToFetch.set(foodId, { type: mealType });
          }
        }
      }
    }
  }

  // Step 2: Batch fetch all food information
  const foodInfoMap = new Map<string, any>();
  const fetchPromises: Promise<void>[] = [];

  foodIdsToFetch.forEach(({ type }, id) => {
    const fetchPromise = (async () => {
      try {
        let info;
        if (type === "beverage") {
          info = await fetchBeverageInfo(id);
        } else {
          info = await fetchRecipeInfo(id);
        }
        if (info) { // Only store if fetch was successful
             foodInfoMap.set(id, info);
        } else {
             console.warn(`No info returned for ${type} ID ${id}`);
        }
      } catch (error) {
        // Log error but continue processing other items
        console.error(`Error fetching info for ${type} ID ${id}:`, error instanceof Error ? error.message : error);
        // Optionally store null or an error marker if needed downstream
        // foodInfoMap.set(id, null);
      }
    })();
    fetchPromises.push(fetchPromise);
  });

  // Wait for all fetches to complete (or fail)
  await Promise.all(fetchPromises);
  console.log(`Fetched details for ${foodInfoMap.size} out of ${foodIdsToFetch.size} requested items.`);


  // Step 3: Transform the data day by day
  for (const [dateStr, dayData] of Object.entries(apiResponse.day_plans)) {
    let currentDate: Date;
    try {
      currentDate = normalizeAndValidateDate(dateStr);
    } catch (e) {
      console.error(`Skipping day due to invalid date string: ${dateStr}`, e);
      continue; // Skip this day
    }

    const dateKey = format(currentDate, "yyyy-MM-dd");
    const dayMeal: DayMeals = dayMealsMap.get(dateKey) || {
      date: currentDate,
      meals: [],
    };

    if (!dayData || !Array.isArray(dayData.meals)) {
      // Ensure day exists in map even if it has no meals from API
      if (!dayMealsMap.has(dateKey)) {
          dayMealsMap.set(dateKey, dayMeal);
      }
      continue;
    }

    // Process each meal in the day
    for (const meal of dayData.meals) {
      try {
        const mealFoods: Food[] = [];
        const foodTransformPromises: Promise<Food | null>[] = [];

        // Process each meal type (main course, side dish, etc.)
        for (const [mealType, foodId] of Object.entries(meal.meal_types)) {
          if (typeof foodId !== "string" || foodId.trim() === "") continue;

          const foodInfo = foodInfoMap.get(foodId);

          if (!foodInfo) {
            console.warn(
              `No pre-fetched info found for ${foodId} (type: ${mealType}) in meal ${meal.meal_name} on ${dateStr}. Skipping.`
            );
            continue; // Skip this food item if info wasn't fetched
          }

          // Asynchronously transform food info
          foodTransformPromises.push(
            transformFoodInfo(foodInfo, mealType, foodId)
              .catch(error => {
                  console.error(`Error transforming food info for ${foodId} (type: ${mealType}):`, error);
                  return null; // Return null on error to filter out later
              })
          );
        }

        // Wait for all food transformations for this meal
        const transformedFoods = await Promise.all(foodTransformPromises);
        transformedFoods.forEach(food => {
            if (food) mealFoods.push(food); // Add only successfully transformed foods
        });


        // Calculate combined nutritional info for the meal
        const mealNutritionalInfo = calculateCombinedNutritionalInfo(mealFoods);

        // Get default meal time if not provided, otherwise use provided (needs API update?)
        const mealTime = meal.meal_time || getDefaultMealTime(meal.meal_name);

        // Create the Meal object
        const completeMeal: Meal = {
          // Generate a unique ID for the frontend instance (trace meal)
          id: `trace-${dateStr}-${meal.meal_name}-${meal._id}`,
          originalBackendId: meal._id, // Keep track of original ID
          name: `${
            meal.meal_name.charAt(0).toUpperCase() + meal.meal_name.slice(1)
          }`, // Just use the name, e.g., "Breakfast"
          time: mealTime,
          type: meal.meal_name as "breakfast" | "lunch" | "dinner" | "snack",
          foods: mealFoods,
          nutritionalInfo: mealNutritionalInfo,
          diabetesFriendly: mealFoods.every((food) => food.diabetesFriendly), // Base meal friendliness on foods
          date: currentDate, // Assign the date
          // TODO: Check if scores are generally available for trace data, does an API provide them
          // score: undefined, // Explicitly undefined for trace meals
        };

        dayMeal.meals.push(completeMeal);

      } catch (error) {
        console.error(
          `Error processing meal ${meal._id} on ${dateStr}:`,
          error
        );
      }
    }
    // Sort meals within the day by time
    dayMeal.meals.sort((a, b) => a.time.localeCompare(b.time));
    dayMealsMap.set(dateKey, dayMeal);
  }

  // Convert map back to array and sort final result by date
  const finalDayMeals = Array.from(dayMealsMap.values());
  finalDayMeals.sort((a, b) => a.date.getTime() - b.date.getTime());

  return finalDayMeals;
}

import axios from "axios";
import {
  DayMeals,
  Food,
  NutritionalInfo,
  Meal,
  NutritionalGoals,
  Ingredient,
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

interface FetchApiResponse {
  day_plans: {
    [date: string]: DayData;
  };
  scores?: {
    // Optional top-level scores
    variety_scores?: number[];
    coverage_scores?: number[];
    constraint_scores?: number[];
  };
  _id?: string; // meal plan id
  user_id?: string;
  name?: string;
}

// New ApiResponse type specifically for regenerate-partial
interface RegenerateApiResponse {
  days: {
    [date: string]: {
      _id: string;
      meals: BanditMealData[]; // Assuming the structure is the same as BanditMealData
      user_id: string;
    };
  };
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

export async function saveMealToTrace(
  userId: string,
  date: string, // Expecting "yyyy-MM-dd" format
  mealId: string // This is the originalBackendId (\_id) of the recommendation meal
): Promise<boolean> {
  if (!userId || !date || !mealId) {
    console.error("saveMealToTrace: Missing required parameters.", {
      userId,
      date,
      mealId,
    });
    // Optionally throw a specific error or return false
    throw new Error("User ID, date, and meal ID are required to save a meal.");
    // return false;
  }

  try {
    console.log(
      `Calling save-meal API for user ${userId}, date ${date}, meal ${mealId}`
    );
    const response = await axios.post(`${BACKEND_URL}/beacon/user/save-meal`, {
      user_id: userId,
      date: date,
      meal_id: mealId,
    });

    // Check for successful response (status 200 and expected message)
    if (response.status === 200) {
      console.log(
        `Successfully saved meal ${mealId} for date ${date} to trace (Status 200). Response data:`,
        response.data // Log the actual response data
      );
      return true;
    } else {
      // This case might be less common if Axios throws for non-2xx, but good practice
      console.warn(
        `save-meal API returned unexpected non-200 status for meal ${mealId}:`,
        response.status,
        response.data
      );
      // Throw an error for non-200 status to be caught below
      throw new ApiError(
        `Failed to save meal: Server responded with status ${response.status}`,
        response.status,
        response.data
      );
      // return false; // Or return false if you prefer not to throw here
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error saving meal ${mealId} to trace: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
      // Throw a more specific error for handling upstream
      throw new ApiError(
        `Failed to save meal: ${error.response?.data?.detail || error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    // Handle non-Axios errors
    console.error(`Unexpected error saving meal ${mealId} to trace:`, error);
    throw error; // Re-throw unexpected errors
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
    console.log(`Fetching recipe info for ID: ${foodId}`);
    const response = await axios.get(
      `${BACKEND_URL}/beacon/get-recipe-info/${foodId}`
    );
    if (typeof response.data === "string") {
      return { name: response.data }; // Wrap in an object if needed downstream
    }
    console.log(`Recipe info for ID ${foodId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe info for ID ${foodId}:`, error);
    throw error;
  }
}

export async function fetchBeverageInfo(bevId: string) {
  try {
    console.log(`Fetching beverage info for ID: ${bevId}`);
    const response = await axios.get(
      `${BACKEND_URL}/beacon/get-beverage-info/${bevId}`
    );
    if (typeof response.data === "string") {
      return { name: response.data }; // Wrap in an object if needed downstream
    }
    console.log(`Beverage info for ID ${bevId}:`, response.data);
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
      `Calling the retrieve-days API for user ${userId} on dates: ${dates.join(
        ", "
      )}`
    );
    const response = await axios.post<FetchApiResponse>(
      `${BACKEND_URL}/beacon/recommendation/retrieve-days/${userId}`,
      { dates }
    );

    // Check specifically for the day_plans structure
    if (!response.data || typeof response.data.day_plans !== "object") {
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
        console.log(
          `No meal history found for user ${userId} on dates ${dates.join(
            ", "
          )} (Status: ${error.response?.status}). Returning empty data.`
        );
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

export async function regeneratePartialMeals(
  userId: string,
  dates: string[]
): Promise<RegenerateApiResponse> {
  // Return the specific response type
  if (!userId) {
    console.error("regeneratePartialMeals called with no userId.");
    throw new ApiError("User ID is required for regeneration.", 400);
  }
  if (!dates || dates.length === 0) {
    console.log("regeneratePartialMeals called with no dates.");
    // Return an empty structure consistent with the expected success response
    return { days: {} };
  }

  try {
    console.log(
      `Calling regenerate-partial API for user ${userId} on dates: ${dates.join(
        ", "
      )}`
    );
    const response = await axios.post<RegenerateApiResponse>( // Expect RegenerateApiResponse
      `${BACKEND_URL}/beacon/recommendation/regenerate-partial`,
      {
        user_id: userId,
        dates_to_regenerate: dates,
      }
    );

    // Basic validation of the response structure
    if (!response.data || typeof response.data.days !== "object") {
      console.error(
        "Invalid response format from regenerate-partial API:",
        response.data
      );
      throw new ApiError(
        "Invalid response format from regeneration API.",
        500,
        response.data
      );
    }

    console.log(`Successfully regenerated meals for ${dates.join(", ")}`);
    console.log("Regeneration Response:", response.data);
    return response.data; // Return the full response data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error regenerating meals: ${error.message}`,
        error.response?.data
      );
      // Throw a specific error for easier handling upstream
      throw new ApiError(
        `Failed to regenerate meals: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    // Handle non-Axios errors
    console.error("Unexpected error regenerating meals:", error);
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
    console.error(
      "generateDateRange received invalid date(s)",
      startDate,
      endDate
    );
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
    console.error(
      "Invalid date input type in normalizeAndValidateDate:",
      dateInput
    );
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
export async function transformFoodInfo(
  foodInfo: any,
  mealType: string,
  foodId: string // Keep original ID for reference
): Promise<Food> {
  if (!foodInfo) {
    console.error(
      `transformFoodInfo called with null/undefined foodInfo for ID ${foodId}, Type ${mealType}`
    );
    // Return a placeholder or throw? Let's throw for clarity during debugging.
    throw new Error(`Missing food info for transformation (ID: ${foodId})`);
    // Or return a placeholder Food object:
    // return { id: foodId, name: `Error Loading (${foodId})`, type: mealType as any, ingredients: [], nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, preparationTime: 0, cookingTime: 0, instructions: [], allergens: [] };
  }

  // Calculate nutritional info for the whole item first
  const nutritionalInfo = calculateNutritionalInfo(foodInfo);

  // Transform ingredients
  const ingredients: Ingredient[] =
    foodInfo.ingredients?.map((ing: any, index: number) => {
      const ingName =
        ing.name || ing.ingredient_name || `Unknown Ingredient ${index + 1}`;
      // Attempt to create a somewhat unique ID based on name if backend ID isn't provided
      const ingId =
        ing.id ||
        `${foodId}-ing-${ingName.toLowerCase().replace(/\s+/g, "-")}-${index}}`;
      const ingNutritionalInfo = calculateNutritionalInfo(ing); // Calculate per ingredient
      return {
        id: ingId,
        name: ingName,
        amount: parseFloat(ing.quantity?.measure) || 1,
        unit: ing.quantity?.unit || "unit",
        category: ing.category || "other",
        nutritionalInfo: ingNutritionalInfo,
        allergens: ing.allergies?.category || [],
        culturalOrigin: ing.cultural_origin || foodInfo.cultural_origin || [], // Inherit if needed
        diabetesFriendly: isDiabetesFriendly(ingNutritionalInfo), // Check each ingredient
      };
    }) || [];

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
      foodInfo.instructions?.map(
        (inst: any) => inst.original_text || inst.text || ""
      ) || [],
    culturalOrigin: foodInfo.cultural_origin || [],
    allergens: foodInfo.allergens || extractAllergensFromR3(foodInfo), // Use helper if needed
    // tips: foodInfo.tips || [], // if available
  };
}

// Helper function to calculate combined nutritional info for a meal
function calculateCombinedNutritionalInfo(foods: Food[]): NutritionalInfo {
  const initial: NutritionalInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fiber: 0,
  };

  if (!foods || foods.length === 0) return initial;

  const combined = foods.reduce((acc, food) => {
    const info = food.nutritionalInfo || {}; // Handle potentially missing info
    return {
      calories: acc.calories + (info.calories || 0),
      protein: acc.protein + (info.protein || 0),
      carbs: acc.carbs + (info.carbs || 0),
      fiber: acc.fiber + (info.fiber || 0),
    };
  }, initial);

  return {
    ...combined,
  };
}

// Main transformation function for TRACE data (from retrieve-days)
export async function transformApiResponseToDayMeals(
  apiResponse: FetchApiResponse
): Promise<DayMeals[]> {
  if (
    !apiResponse ||
    !apiResponse.day_plans ||
    typeof apiResponse.day_plans !== "object"
  ) {
    console.error(
      "Invalid API response format in transformApiResponseToDayMeals:",
      apiResponse
    );
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
        if (info) {
          // Only store if fetch was successful
          foodInfoMap.set(id, info);
        } else {
          console.warn(`No info returned for ${type} ID ${id}`);
        }
      } catch (error) {
        // Log error but continue processing other items
        console.error(
          `Error fetching info for ${type} ID ${id}:`,
          error instanceof Error ? error.message : error
        );
        // Optionally store null or an error marker if needed downstream
        // foodInfoMap.set(id, null);
      }
    })();
    fetchPromises.push(fetchPromise);
  });

  // Wait for all fetches to complete (or fail)
  await Promise.all(fetchPromises);
  console.log(
    `Fetched details for ${foodInfoMap.size} out of ${foodIdsToFetch.size} requested items.`
  );

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
        const mealFoodIds = new Set<string>();
        const foodItemsToTransform: { foodId: string; mealType: string }[] = [];

        // Collect unique food IDs and their types for this meal
        for (const [mealType, foodId] of Object.entries(meal.meal_types)) {
          if (typeof foodId !== "string" || foodId.trim() === "") continue;

          const foodInfo = foodInfoMap.get(foodId);
          if (!foodInfo) {
            console.warn(
              `No pre-fetched info found for ${foodId} (type: ${mealType}) in meal ${meal.meal_name} on ${dateStr}. Skipping.`
            );
            continue; // Skip this food item if info wasn't fetched
          }

          if (!mealFoodIds.has(foodId)) {
            mealFoodIds.add(foodId);
            foodItemsToTransform.push({ foodId, mealType });
          } else {
            // Optional: Log if a duplicate was found in the raw data for this meal
            // console.log(`Skipping duplicate food ID '${foodId}' within meal '${meal.meal_name}' on ${dateStr}.`);
          }
        }

        // Asynchronously transform unique food info for this meal
        const foodTransformPromises: Promise<Food | null>[] =
          foodItemsToTransform.map(({ foodId, mealType }) => {
            const foodInfo = foodInfoMap.get(foodId)!; // We know it exists from the previous loop
            return transformFoodInfo(foodInfo, mealType, foodId).catch(
              (error) => {
                console.error(
                  `Error transforming food info for ${foodId} (type: ${mealType}):`,
                  error
                );
                return null; // Return null on error to filter out later
              }
            );
          });

        // Wait for all food transformations for this meal
        const transformedFoods = await Promise.all(foodTransformPromises);
        const mealFoods: Food[] = transformedFoods.filter(
          (food): food is Food => food !== null
        ); // Filter out nulls and ensure type correctness

        // Calculate combined nutritional info for the meal
        const mealNutritionalInfo = calculateCombinedNutritionalInfo(mealFoods);

        // Get default meal time if not provided, otherwise use provided (needs API update?)
        const mealTime = meal.meal_time || getDefaultMealTime(meal.meal_name);

        // Get Individual Scores for Trace Meal
        const varietyScore = meal.variety_score ?? 0; // Default to 0 if missing
        const coverageScore = meal.item_coverage_score ?? 0;
        const constraintScore = meal.nutritional_constraint_score ?? 0;

        // Find the index of the current meal within the day's meals array from the API response
        // This assumes the order from the API is somewhat stable for a given fetch,
        // or at least provides *some* differentiation if _id collides.
        const mealIndexInResponse = dayData.meals.findIndex(
          (apiMeal) =>
            apiMeal._id === meal._id && apiMeal.meal_name === meal.meal_name
        );

        // Find the index (optional, might not be needed if _id is truly unique per trace)
        // const mealIndexInResponse = dayData.meals.findIndex(
        //   (apiMeal) => apiMeal._id === meal._id
        // );

        // Generate a potentially more unique ID by including the index
        // const uniqueFrontendId = `trace-${dateStr}-${meal.meal_name}-${meal._id}-${mealIndexInResponse}`;

        // Create the Meal object
        const completeMeal: Meal = {
          // id: uniqueFrontendId,
          id: meal._id,
          originalBackendId: meal._id, // Keep track of original ID
          name: `${
            meal.meal_name.charAt(0).toUpperCase() + meal.meal_name.slice(1)
          }`,
          time: mealTime,
          type: meal.meal_name as "breakfast" | "lunch" | "dinner" | "snack",
          foods: mealFoods,
          nutritionalInfo: mealNutritionalInfo,
          diabetesFriendly: mealFoods.every((food) => food.diabetesFriendly),
          date: currentDate,
          varietyScore: varietyScore,
          coverageScore: coverageScore,
          constraintScore: constraintScore,
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

export async function deleteMealFromTrace(
  userId: string,
  date: string, // Expecting "yyyy-MM-dd" format
  mealId: string // The backend ID (_id) of the trace meal record
): Promise<boolean> {
  if (!userId || !date || !mealId) {
    console.error("deleteMealFromTrace: Missing required parameters.", {
      userId,
      date,
      mealId,
    });
    throw new Error(
      "User ID, date, and meal ID are required to delete a meal."
    );
  }

  try {
    console.log(
      `Calling delete-meal API for user ${userId}, date ${date}, meal ${mealId}`
    );
    // Note: Axios DELETE typically sends data in config.data
    const response = await axios.delete(
      `${BACKEND_URL}/beacon/user/delete-meal`,
      {
        data: {
          // Data needs to be nested under 'data' for axios.delete
          user_id: userId,
          date: date,
          meal_id: mealId,
        },
      }
    );

    // Rely primarily on the HTTP status code for success indication.
    // Axios typically throws for non-2xx statuses by default,
    // so reaching this point often implies a 2xx status.
    // We explicitly check for 200 for clarity and robustness.
    if (response.status === 200) {
      console.log(
        `Successfully deleted meal ${mealId} for date ${date} from trace (Status 200). Response data:`,
        response.data // Log the actual response data
      );
      return true;
    } else {
      // This block handles cases where the status might be 2xx but not 200,
      // or if Axios is configured not to throw on non-2xx errors.
      console.warn(
        `delete-meal API returned unexpected status for meal ${mealId}:`,
        response.status,
        response.data
      );
      throw new ApiError(
        `Failed to delete meal: Server responded with status ${response.status}`, // More accurate error message
        response.status,
        response.data
      );
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error deleting meal ${mealId} from trace: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
      throw new ApiError(
        `Failed to delete meal: ${
          error.response?.data?.detail || // Use backend detail if available
          error.response?.data?.Message || // Use backend Message if available
          error.message // Fallback to Axios message
        }`,
        error.response?.status,
        error.response?.data
      );
    }
    console.error(
      `Unexpected error deleting meal ${mealId} from trace:`,
      error
    );
    throw error; // Re-throw unexpected errors
  }
}

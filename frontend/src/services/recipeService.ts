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

// Define the default nutritional values
const DEFAULT_NUTRITIONAL_VALUES: Record<string, NutritionalInfo> = {
  main_course: {
    calories: 300,
    fiber: 4,
    carbs: 50,
    protein: 20,
  },
  side_dish: {
    calories: 100,
    fiber: 2,
    carbs: 20,
    protein: 5,
  },
  dessert: {
    calories: 200,
    fiber: 0,
    carbs: 100,
    protein: 5,
  },
  beverage: {
    calories: 50,
    fiber: 0,
    carbs: 50,
    protein: 0,
  },
};

// Helper function to get default nutritional info based on type
const getDefaultNutritionalInfo = (mealType: string): NutritionalInfo => {
  const normalizedType = mealType.toLowerCase().replace(/\s+/g, "_");
  return (
    DEFAULT_NUTRITIONAL_VALUES[normalizedType] ||
    DEFAULT_NUTRITIONAL_VALUES.unknown
  );
};

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
  name?: string; // Corresponds to meal_plan_name from backend
  meal_plan_name?: string;
}

// New ApiResponse type specifically for regenerate-partial
interface RegenerateApiResponse {
  days: {
    [date: string]: {
      _id: string;
      meals: BanditMealData[]; // Assuming the structure is the same as BanditMealData
      user_id: string;
      // Backend might return meal_plan_name here too, add if necessary
      // meal_plan_name?: string;
    };
  };
  // Backend might return meal_plan_name at top level too, add if necessary
  // meal_plan_name?: string;
}

// Placeholder type for food info fetched from API or created on error
export interface FetchedFoodInfo {
  id: string;
  type: string; // 'main_course', 'beverage', etc.
  data?: any; // Actual data from API if successful
  error?: boolean; // Flag indicating fetch error
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
    // console.log(`Fetching recipe info for ID: ${foodId}`);
    const response = await axios.get(
      `${BACKEND_URL}/beacon/get-recipe-info/${foodId}`
    );
    if (typeof response.data === "string") {
      // If API returns just a string (e.g., name), wrap it for consistency
      return { name: response.data };
    }
    // console.log(`Recipe info for ID ${foodId}:`, response.data);
    return response.data; // Expecting an object with recipe details
  } catch (error) {
    console.error(`Error fetching recipe info for ID ${foodId}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

export async function fetchBeverageInfo(bevId: string) {
  try {
    // console.log(`Fetching beverage info for ID: ${bevId}`);
    const response = await axios.get(
      `${BACKEND_URL}/beacon/get-beverage-info/${bevId}`
    );
    if (typeof response.data === "string") {
      // If API returns just a string (e.g., name), wrap it for consistency
      return { name: response.data };
    }
    // console.log(`Beverage info for ID ${bevId}:`, response.data);
    return response.data; // Expecting an object with beverage details
  } catch (error) {
    console.error(`Error fetching beverage info for ID ${bevId}:`, error);
    throw error; // Re-throw to be handled by the caller
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

    // console.log(`Fetched meal days for ${dates.join(", ")}`);
    // console.log(response.data);
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
        return { day_plans: {} };
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
  mealPlanName: string,
  dates: string[]
): Promise<RegenerateApiResponse> {
  // Return the specific response type
  if (!userId) {
    console.error("regeneratePartialMeals called with no userId.");
    throw new ApiError("User ID is required for regeneration.", 400);
  }
  if (!mealPlanName) {
    console.error("regeneratePartialMeals called with no mealPlanName.");
    throw new ApiError("Meal Plan Name is required for regeneration.", 400);
  }
  if (!dates || dates.length === 0) {
    console.log("regeneratePartialMeals called with no dates.");
    // Return an empty structure consistent with the expected success response
    return { days: {} };
  }

  try {
    console.log(
      `Calling regenerate-partial API for user ${userId}, plan '${mealPlanName}' on dates: ${dates.join(
        ", "
      )}`
    );
    const response = await axios.post<RegenerateApiResponse>( // Expect RegenerateApiResponse
      `${BACKEND_URL}/beacon/recommendation/regenerate-partial`,
      {
        user_id: userId,
        meal_plan_name: mealPlanName,
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

    // console.log(`Successfully regenerated meals for ${dates.join(", ")}`);
    // console.log("Regeneration Response:", response.data);
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
  fetchedInfo: FetchedFoodInfo,
  mealType: string,
  foodId: string,
  mealInstanceId: string
): Promise<Food> {
  // Initialize variables that might be set in either branch
  let nutritionalInfo: NutritionalInfo;
  let ingredients: Ingredient[] = [];
  let foodName = "Unknown Food";
  let preparationTime = 0;
  let cookingTime = 0;
  let instructions: string[] = [];
  let culturalOrigin: string[] = [];
  let allergens: string[] = [];
  let diabetesFriendly = false; // Default to false

  // Check if there was an error fetching or if data is missing/empty
  if (
    fetchedInfo.error ||
    !fetchedInfo.data ||
    Object.keys(fetchedInfo.data).length === 0
  ) {
    console.warn(
      `transformFoodInfo: Using default values for ${mealType} ID ${foodId} due to fetch error or missing/empty data.`
    );
    nutritionalInfo = getDefaultNutritionalInfo(mealType);
    foodName = `Unavailable ${mealType.replace("_", " ")}`;
    // Keep other fields as defaults (empty arrays, 0 times, false boolean)
    // Note: diabetesFriendly is already defaulted to false above
  } else {
    // Data exists, process it as before
    const foodData = fetchedInfo.data;
    foodName =
      foodData.recipe_name ||
      foodData.name ||
      `Unnamed ${mealType.replace("_", " ")}`;

    // Calculate nutritional info from the fetched data
    const calculatedNutritionalInfo = calculateNutritionalInfo(foodData);

    // Check if the calculated nutritional info is effectively zero
    const calculatedIsZero =
      calculatedNutritionalInfo.calories === 0 &&
      calculatedNutritionalInfo.protein === 0 &&
      calculatedNutritionalInfo.carbs === 0 &&
      calculatedNutritionalInfo.fiber === 0;

    // *** MODIFIED LOGIC START ***
    // If calculated info is zero, apply defaults for this type.
    // This handles cases where API returns data but no/zero nutrition.
    if (calculatedIsZero) {
      console.warn(
        `transformFoodInfo: Calculated nutrition for ${foodName} (ID ${foodId}) is zero. Applying defaults for type '${mealType}'.`
      );
      nutritionalInfo = getDefaultNutritionalInfo(mealType); // Apply defaults
    } else {
      nutritionalInfo = calculatedNutritionalInfo; // Use calculated non-zero values
    }

    // Transform ingredients if they exist (using foodData)
    ingredients =
      foodData.ingredients?.map((ing: any, index: number) => {
        const ingName =
          ing.name || ing.ingredient_name || `Unknown Ingredient ${index + 1}`;

        // Incorporates mealInstanceId, foodId (recipe/beverage ID), name, and index
        const uniqueIngredientId = `${mealInstanceId}-${foodId}-ing-${ingName
          .toLowerCase()
          .replace(/\s+/g, "-")}-${index}`;

        const ingNutritionalInfo = calculateNutritionalInfo(ing);
        return {
          id: uniqueIngredientId,
          name: ingName,
          amount: parseFloat(ing.quantity?.measure) || 1,
          unit: ing.quantity?.unit || "unit",
          category: ing.category || "other",
          nutritionalInfo: ingNutritionalInfo,
          allergens: ing.allergies?.category || [],
          culturalOrigin: ing.cultural_origin || foodData.cultural_origin || [],
          diabetesFriendly: isDiabetesFriendly(ingNutritionalInfo),
        };
      }) || [];

    // Calculate overall diabetes friendliness based on the *final* nutritionalInfo (calculated or default)
    diabetesFriendly = isDiabetesFriendly(nutritionalInfo);
    preparationTime = parseInt(foodData.prep_time?.split(" ")[0] || "0");
    cookingTime = parseInt(foodData.cook_time?.split(" ")[0] || "0");
    instructions =
      foodData.instructions?.map(
        (inst: any) => inst.original_text || inst.text || ""
      ) || [];
    culturalOrigin = foodData.cultural_origin || [];
    allergens = foodData.allergens || extractAllergensFromR3(foodData);
  }

  // Construct the final Food object
  return {
    id: foodId, // Use the original ID passed in
    name: foodName,
    type: mealType as
      | "main_course"
      | "side_dish"
      | "beverage"
      | "dessert"
      | "snack",
    ingredients,
    nutritionalInfo, // Use calculated or default info
    diabetesFriendly, // Use calculated or default value
    preparationTime,
    cookingTime,
    instructions,
    culturalOrigin,
    allergens,
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
    // Use the nutritionalInfo from the Food object, which might be default values
    const info = food.nutritionalInfo || {};
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

  const mealPlanName = apiResponse.name || apiResponse.meal_plan_name;

  const dayMealsMap = new Map<string, DayMeals>();

  // Step 1: Collect all unique food/beverage IDs to fetch
  const foodIdsToFetch = new Map<string, { type: string }>();
  for (const dayData of Object.values(apiResponse.day_plans)) {
    if (!dayData || !Array.isArray(dayData.meals)) continue;
    for (const meal of dayData.meals) {
      for (const [rawMealType, foodId] of Object.entries(meal.meal_types)) {
        if (typeof foodId === "string" && foodId.trim() !== "") {
          // Map "side" key from backend data to "side_dish" type used internally
          const mealType = rawMealType === "side" ? "side_dish" : rawMealType;
          if (!foodIdsToFetch.has(foodId)) {
            foodIdsToFetch.set(foodId, { type: mealType }); // Use the potentially mapped mealType
          }
        }
      }
    }
  }

  // Step 2: Batch fetch all food information
  const foodInfoMap = new Map<string, FetchedFoodInfo>(); // Store FetchedFoodInfo
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
        // Store successful fetch result
        foodInfoMap.set(id, { id, type, data: info, error: false });
      } catch (error) {
        // Log error and store placeholder indicating failure
        console.error(
          `Error fetching info for ${type} ID ${id}:`,
          error instanceof Error ? error.message : error
        );
        // Store placeholder with error flag
        foodInfoMap.set(id, { id, type, error: true });
      }
    })();
    fetchPromises.push(fetchPromise);
  });

  // Wait for all fetches to complete (or fail)
  await Promise.all(fetchPromises);
  console.log(
    `Fetched/Processed details for ${foodInfoMap.size} out of ${foodIdsToFetch.size} requested items.`
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
      // meal is from backend, meal._id is unique for this trace meal instance
      try {
        const mealInstanceId = meal._id; // Unique ID for this specific meal occurrence
        const mealFoodIds = new Set<string>();
        const foodItemsToTransform: { foodId: string; mealType: string }[] = [];

        // Collect unique food IDs and their types for this meal
        for (const [mealType, foodId] of Object.entries(meal.meal_types)) {
          if (typeof foodId !== "string" || foodId.trim() === "") continue;

          const fetchedInfo = foodInfoMap.get(foodId);
          if (!fetchedInfo) {
            console.error(
              `Internal Error: No fetched info found for ${foodId} (type: ${mealType}) in meal ${meal.meal_name} on ${dateStr}. Skipping.`
            );
            continue;
          }

          if (!mealFoodIds.has(foodId)) {
            mealFoodIds.add(foodId);
            foodItemsToTransform.push({ foodId, mealType: fetchedInfo.type });
          }
        }

        // Asynchronously transform unique food info for this meal
        const foodTransformPromises: Promise<Food | null>[] =
          foodItemsToTransform.map(({ foodId, mealType }) => {
            const fetchedInfo = foodInfoMap.get(foodId)!;
            // Pass the FetchedFoodInfo object AND mealInstanceId to transformFoodInfo
            // transformFoodInfo returns the BASE Food object with the ORIGINAL foodId
            return transformFoodInfo(
              fetchedInfo,
              mealType,
              foodId,
              mealInstanceId
            ).catch((error) => {
              console.error(
                `Error transforming food info for ${foodId} (type: ${mealType}):`,
                error
              );
              return null;
            });
          });

        // Wait for all food transformations for this meal
        const transformedFoods = await Promise.all(foodTransformPromises);
        const baseMealFoods: Food[] = transformedFoods.filter(
          (food): food is Food => food !== null
        ); // Filter out nulls and ensure type correctness

        // Generate unique instance IDs for foods within this meal
        const mealFoodsWithInstanceIds: Food[] = baseMealFoods.map(
          (baseFood) => ({
            ...baseFood,
            // Create a unique ID for this specific food instance within this meal
            id: `${mealInstanceId}-${baseFood.id}`,
          })
        );

        const sideDishFood = mealFoodsWithInstanceIds.find(
          (f) => f.type === "side_dish"
        ); // Find any side dish
        if (sideDishFood) {
          console.log(
            `DEBUG (Trace): Before combining meal '${meal.meal_name}' on ${dateStr} - Side Dish (${sideDishFood.name}, ID: ${sideDishFood.id}) Nutritional Info:`,
            JSON.stringify(sideDishFood.nutritionalInfo)
          );
        } else {
          console.log(
            `DEBUG (Trace): Before combining meal '${meal.meal_name}' on ${dateStr} - No side dish found.`
          );
        }

        // Calculate combined nutritional info for the meal (using potentially default values)
        // Use the foods with instance IDs, nutrition info remains the same
        const mealNutritionalInfo = calculateCombinedNutritionalInfo(
          mealFoodsWithInstanceIds
        );

        console.log(
          `DEBUG (Trace): After combining meal '${meal.meal_name}' on ${dateStr} - Combined Meal Nutritional Info:`,
          JSON.stringify(mealNutritionalInfo)
        );

        // Get default meal time if not provided
        const mealTime = meal.meal_time || getDefaultMealTime(meal.meal_name);

        // Get Individual Scores
        const varietyScore = meal.variety_score ?? 0;
        const coverageScore = meal.item_coverage_score ?? 0;
        const constraintScore = meal.nutritional_constraint_score ?? 0;

        // Create the Meal object
        const completeMeal: Meal = {
          id: mealInstanceId, // Use mealInstanceId (which is meal._id from backend)
          originalBackendId: meal._id,
          name: `${
            meal.meal_name.charAt(0).toUpperCase() + meal.meal_name.slice(1)
          }`,
          time: mealTime,
          type: meal.meal_name as "breakfast" | "lunch" | "dinner" | "snack",
          foods: mealFoodsWithInstanceIds, // Use the foods with unique instance IDs
          nutritionalInfo: mealNutritionalInfo,
          // Base diabetes friendliness on the actual foods (which might have default nutrition)
          diabetesFriendly: mealFoodsWithInstanceIds.every(
            (food) => food.diabetesFriendly
          ),
          date: currentDate,
          varietyScore: varietyScore,
          coverageScore: coverageScore,
          constraintScore: constraintScore,
          isFavorited: meal.favorited ?? false,
          mealPlanName: mealPlanName,
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

export async function favoriteMealInTrace(
  userId: string,
  date: string, // Expecting "yyyy-MM-dd" format
  mealId: string // The backend ID (_id) of the trace meal record
): Promise<boolean> {
  if (!userId || !date || !mealId) {
    console.error("favoriteMealInTrace: Missing required parameters.", {
      userId,
      date,
      mealId,
    });
    throw new Error(
      "User ID, date, and meal ID are required to favorite a meal."
    );
  }

  try {
    console.log(
      `Calling favorite-meal API for user ${userId}, date ${date}, meal ${mealId}`
    );
    const response = await axios.post(
      `${BACKEND_URL}/beacon/user/favorite-meal`,
      {
        user_id: userId,
        date: date,
        meal_id: mealId,
      }
    );

    // Rely primarily on the HTTP status code for success indication.
    if (response.status === 200) {
      console.log(
        `Successfully favorited meal ${mealId} for date ${date} (Status 200). Response data:`,
        response.data // Log the actual response data (which might contain useful info)
      );
      return true;
    } else {
      // This block handles cases where the status might be 2xx but not 200,
      // or if Axios is configured not to throw on non-2xx errors.
      // It's less likely to be reached if Axios default behavior is used,
      // but good practice to keep.
      console.warn(
        `favorite-meal API returned unexpected status for meal ${mealId}:`,
        response.status,
        response.data
      );
      throw new ApiError(
        `Failed to favorite meal: Server responded with status ${response.status}`, // More accurate error message
        response.status,
        response.data
      );
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error favoriting meal ${mealId}: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
      // Throw a more specific error for handling upstream
      throw new ApiError(
        `Failed to favorite meal: ${
          error.response?.data?.detail || // Use backend detail if available
          error.response?.data?.Message || // Use backend Message if available
          error.message // Fallback to Axios message
        }`,
        error.response?.status,
        error.response?.data
      );
    }
    // Handle non-Axios errors
    console.error(`Unexpected error favoriting meal ${mealId}:`, error);
    throw error; // Re-throw unexpected errors
  }
}

export async function unfavoriteMealInTrace(
  userId: string,
  date: string, // Expecting "yyyy-MM-dd" format
  mealId: string // The backend ID (_id) of the trace meal record
): Promise<boolean> {
  if (!userId || !date || !mealId) {
    console.error("unfavoriteMealInTrace: Missing required parameters.", {
      userId,
      date,
      mealId,
    });
    throw new Error(
      "User ID, date, and meal ID are required to unfavorite a meal."
    );
  }

  try {
    console.log(
      `Calling unfavorite-meal API for user ${userId}, date ${date}, meal ${mealId}`
    );
    const response = await axios.post(
      `${BACKEND_URL}/beacon/user/unfavorite-meal`, // Use the correct endpoint
      {
        user_id: userId,
        date: date,
        meal_id: mealId,
      }
    );

    // Rely primarily on the HTTP status code for success indication.
    if (response.status === 200) {
      // Note: The API spec has a typo "favoritd". We'll log the actual message but rely on status 200.
      console.log(
        `Successfully unfavorited meal ${mealId} for date ${date} (Status 200). Response data:`,
        response.data
      );
      return true;
    } else {
      // This block handles cases where the status might be 2xx but not 200,
      // or if Axios is configured not to throw on non-2xx errors.
      console.warn(
        `unfavorite-meal API returned unexpected status for meal ${mealId}:`,
        response.status,
        response.data
      );
      throw new ApiError(
        `Failed to unfavorite meal: Server responded with status ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error unfavoriting meal ${mealId}: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
      // Throw a more specific error for handling upstream
      throw new ApiError(
        `Failed to unfavorite meal: ${
          error.response?.data?.detail || // Use backend detail if available
          error.response?.data?.Message || // Use backend Message if available (handle potential typo)
          error.message // Fallback to Axios message
        }`,
        error.response?.status,
        error.response?.data
      );
    }
    // Handle non-Axios errors
    console.error(`Unexpected error unfavoriting meal ${mealId}:`, error);
    throw error; // Re-throw unexpected errors
  }
}

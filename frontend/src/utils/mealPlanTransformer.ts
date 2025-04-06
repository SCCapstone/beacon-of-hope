import {
  DayRecommendations,
  Food,
  MealRecommendation,
  NutritionalInfo,
  Meal,
  NutritionalGoals,
} from "../components/MealTimeline/types";
import { fetchRecipeInfo, fetchBeverageInfo, transformFoodInfo } from "../services/recipeService";
import { parse, startOfDay, isValid as isValidDate } from "date-fns";

interface BanditMealPlan {
  _id: string;
  user_id: string;
  name: string;
  days: {
    [date: string]: BanditDayData;
  };
  scores?: { // Optional top-level scores
      variety_scores?: number[];
      coverage_scores?: number[];
      constraint_scores?: number[];
  };
}

interface BanditDayData {
  _id: string;
  meals: BanditMealData[];
  user_id: string;
  meal_plan_id: string;
}

export interface BanditMealData {
  _id: string;
  meal_name: string;
  meal_types: {
    beverage?: string;
    main_course?: string;
    side_dish?: string;
    dessert?: string;
  };
  // Include scores directly from the API response structure
  variety_score?: number;
  item_coverage_score?: number;
  nutritional_constraint_score?: number;
  // meal_time might be missing, handle this
  meal_time?: string;
}


interface R3Nutrient {
  measure: string;
  unit: string;
}

interface R3Macronutrients {
  Calories: R3Nutrient;
  Carbohydrates: R3Nutrient;
  Protein: R3Nutrient;
  Fiber: R3Nutrient;
}

export function convertTime24to12(time24h: string): string {
  if (!time24h || !time24h.includes(':')) return "Invalid Time";
  const [hours, minutes] = time24h.split(":");
  let hour = parseInt(hours, 10);
  if (isNaN(hour) || isNaN(parseInt(minutes, 10))) return "Invalid Time";
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; // Converts 0 to 12 for 12 AM, and 12 stays 12 for 12 PM
  return `${hour}:${minutes} ${period}`;
}

export function extractAllergensFromR3(r3Data: any): string[] {
  const allergens = new Set<string>();

  r3Data.ingredients?.forEach((ingredient: any) => {
    if (ingredient.allergies?.category?.length) {
      ingredient.allergies.category.forEach((allergen: string) => {
        allergens.add(allergen.toLowerCase());
      });
    }
  });

  return Array.from(allergens);
}

// Sample R3 data:
// {
//   "alternative": "",
//   "quantity": {
//       "measure": "1",
//       "unit": "lb"
//   },
//   "quality_characteristic": "",
//   "image": "https://example.com/ground_beef_image.jpg",
//   "allergies": {
//       "details": "",
//       "ref": [
//           "https://www.healthline.com/nutrition/foods/pork",
//           "https://www.healthline.com/health/allergies/most-uncommon-food-allergies#red-meat"
//       ],
//       "id": "0xb74d",
//       "category": [
//           "meat"
//       ]
//   },
//   "name": "ground beef"
// }

export function calculateNutritionalInfo(r3Data: {
  macronutrients?: R3Macronutrients;
  // Allow passing nutrition directly if available (e.g., from ingredient level)
  nutrition?: R3Macronutrients;
}): NutritionalInfo {
  // Prioritize 'nutrition' if present, fallback to 'macronutrients'
  const macros = r3Data?.nutrition || r3Data?.macronutrients;

  // Helper function to safely parse numerical values from various possible structures
  const parseNutrientValue = (nutrient?: R3Nutrient | string | number): number => {
    if (nutrient === undefined || nutrient === null) return 0;

    let valueStr: string | undefined;

    if (typeof nutrient === 'object' && nutrient !== null && 'measure' in nutrient) {
      valueStr = nutrient.measure;
    } else if (typeof nutrient === 'string') {
      valueStr = nutrient;
    } else if (typeof nutrient === 'number') {
      return isNaN(nutrient) ? 0 : nutrient; // Return number directly if valid
    }

    if (typeof valueStr === 'string') {
        // Remove units like 'g', 'mg', 'kcal' before parsing
        const numericPart = valueStr.replace(/[^\d.-]/g, '');
        const value = parseFloat(numericPart);
        return isNaN(value) ? 0 : value;
    }

    return 0; // Fallback
  };

  const calories = parseNutrientValue(macros?.Calories);
  const carbs = parseNutrientValue(macros?.Carbohydrates);
  const protein = parseNutrientValue(macros?.Protein);
  const fiber = parseNutrientValue(macros?.Fiber);

  return {
    calories,
    protein,
    carbs,
    fiber,
  };
}

export function isDiabetesFriendly(
  nutritionalInfo: NutritionalInfo | undefined,
  goals?: NutritionalGoals | null // Optional goals for context
): boolean {
  if (!nutritionalInfo) return false; // Cannot determine if no info

  // Define thresholds
  const CARB_LIMIT = goals ? goals.carbohydrates.daily : 45; // grams per item/serving (adjust if this is per meal)
  const FIBER_MINIMUM = goals ? goals.fiber.daily : 3; // grams per item/serving

  // Destructure necessary nutritional values, providing defaults if missing
  const { carbs = 0, fiber = 0 } = nutritionalInfo;

  // Check each criterion
  const meetsCarbLimit = carbs <= CARB_LIMIT;
  const meetsFiberRequirement = fiber >= FIBER_MINIMUM;

  return meetsCarbLimit && meetsFiberRequirement;
}

// Add getDefaultMealTime if not already present
export function getDefaultMealTime(mealName: string): string {
  switch (mealName.toLowerCase()) {
    case "breakfast": return "08:00";
    case "lunch": return "12:30";
    case "dinner": return "18:30";
    case "snack": return "15:00";
    case "morning snack": return "10:00";
    case "afternoon snack": return "15:30";
    case "evening snack": return "21:00";
    default:
        // Try to infer from name if possible, otherwise default
        if (mealName.toLowerCase().includes("breakfast")) return "08:00";
        if (mealName.toLowerCase().includes("lunch")) return "12:30";
        if (mealName.toLowerCase().includes("dinner")) return "18:30";
        if (mealName.toLowerCase().includes("snack")) return "15:00";
        return "12:00"; // Fallback
  }
}

// Helper function to calculate combined nutritional info for a Meal
export function calculateCombinedMealNutritionalInfo(foods: Food[]): NutritionalInfo {
  const initial: NutritionalInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fiber: 0,
  };

  if (!foods || foods.length === 0) return initial;

  const combined = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + (food.nutritionalInfo?.calories || 0),
      protein: acc.protein + (food.nutritionalInfo?.protein || 0),
      carbs: acc.carbs + (food.nutritionalInfo?.carbs || 0),
      fiber: acc.fiber + (food.nutritionalInfo?.fiber || 0),
    }),
    initial
  );

  return {
    ...combined,
  };
}

// // Helper function to transform a single food item (recipe or beverage)
// async function transformSingleFoodItem(
//   foodId: string,
//   mealType: string
// ): Promise<Food | null> {
//   try {
//     let foodInfo;
//     const isBeverage = mealType === "beverage";

//     if (isBeverage) {
//       foodInfo = await fetchBeverageInfo(foodId);
//     } else {
//       foodInfo = await fetchRecipeInfo(foodId);
//     }

//     if (!foodInfo) {
//       console.warn(`No info found for ${mealType} with ID ${foodId}`);
//       return null;
//     }

//     // Transform ingredients using calculateNutritionalInfo and isDiabetesFriendly from recipeService
//     const ingredients: Ingredient[] =
//       foodInfo.ingredients?.map((ing: any, index: number) => {
//         const ingName = ing.name || ing.ingredient_name || `Unknown Ingredient ${index + 1}`;
//         const ingId = (ing.id || ingName).toLowerCase().replace(/\s+/g, "-");
//         const ingNutritionalInfo = calculateNutritionalInfo(ing);
//         return {
//             id: ingId,
//             name: ingName,
//             amount: parseFloat(ing.quantity?.measure) || 1,
//             unit: ing.quantity?.unit || "unit",
//             category: ing.category || "other",
//             nutritionalInfo: ingNutritionalInfo,
//             allergens: ing.allergies?.category || [],
//             culturalOrigin: ing.cultural_origin || foodInfo.cultural_origin || [],
//             diabetesFriendly: isDiabetesFriendly(ingNutritionalInfo), // Check ingredient
//         };
//       }) || [];

//     const nutritionalInfo = calculateNutritionalInfo(foodInfo);

//     // Transform food
//     const food: Food = {
//       id: foodId,
//       name: foodInfo.recipe_name || foodInfo.name || "Unnamed Food",
//       type: mealType as
//         | "main_course"
//         | "side_dish"
//         | "beverage"
//         | "dessert"
//         | "snack",
//       ingredients,
//       nutritionalInfo,
//       diabetesFriendly: isDiabetesFriendly(nutritionalInfo),
//       preparationTime: parseInt(foodInfo.prep_time?.split(" ")[0] || "0"),
//       cookingTime: parseInt(foodInfo.cook_time?.split(" ")[0] || "0"),
//       instructions:
//         foodInfo.instructions?.map((inst: any) => inst.original_text || inst.text || "") || [],
//       culturalOrigin: foodInfo.cultural_origin || [],
//       allergens: extractAllergensFromR3(foodInfo), // Use existing helper
//     };

//     return food;
//   } catch (error) {
//     console.error(`Error processing ${mealType} with ID ${foodId}:`, error);
//     return null;
//   }
// }

export async function transformMealPlanToRecommendations(
  mealPlan: BanditMealPlan, // Use the specific type for bandit response
  userGoals: NutritionalGoals | null // Accept optional user goals
): Promise<DayRecommendations[]> {
  if (!mealPlan || !mealPlan.days || typeof mealPlan.days !== 'object') {
    console.error("Invalid meal plan data received for recommendations:", mealPlan);
    return [];
  }

  const recommendations: DayRecommendations[] = [];
  const foodIdsToFetch = new Map<string, { type: string }>(); // Map ID to its type

  // Step 1: Collect all unique food/beverage IDs and their types
  Object.values(mealPlan.days).forEach(dayData => {
      if (!dayData || !Array.isArray(dayData.meals)) return;
      dayData.meals.forEach(meal => {
          Object.entries(meal.meal_types).forEach(([mealType, foodId]) => {
              if (typeof foodId === 'string' && foodId.trim() !== '') {
                  if (!foodIdsToFetch.has(foodId)) {
                      // Store the type ('beverage', 'main_course', etc.)
                      foodIdsToFetch.set(foodId, { type: mealType });
                  }
              }
          });
      });
  });

  // Step 2: Batch fetch info for all unique IDs
  const foodInfoMap = new Map<string, any>();
  const fetchPromises: Promise<void>[] = [];

  foodIdsToFetch.forEach(({ type }, id) => {
    const fetchPromise = (async () => {
      try {
        let info;
        // Use the stored type to determine which fetch function to call
        if (type === "beverage") {
          info = await fetchBeverageInfo(id);
        } else {
          info = await fetchRecipeInfo(id);
        }
        if (info) {
          foodInfoMap.set(id, info);
        } else {
          console.warn(`No info returned for ${type} ID ${id}`);
        }
      } catch (error) {
        console.error(`Error fetching info for ${type} ID ${id}:`, error instanceof Error ? error.message : error);
        // foodInfoMap.set(id, null); // Optionally mark as failed
      }
    })();
    fetchPromises.push(fetchPromise);
  });

  await Promise.all(fetchPromises);
  console.log(`Recommendations: Fetched details for ${foodInfoMap.size} out of ${foodIdsToFetch.size} requested items.`);


  // Step 3: Iterate through days and meals to build recommendations using fetched data
  for (const [dateStr, dayData] of Object.entries(mealPlan.days)) {
    let currentDate: Date;
    try {
        currentDate = parse(dateStr, "yyyy-MM-dd", new Date());
        if (!isValidDate(currentDate)) throw new Error("Parsed date is invalid");
        currentDate = startOfDay(currentDate);
    } catch (e) {
        console.error(`Skipping recommendation day due to invalid date string: ${dateStr}`, e);
        continue;
    }

    const dayRecommendations: DayRecommendations = {
      date: currentDate,
      recommendations: [],
    };

    if (!dayData || !Array.isArray(dayData.meals)) continue;

    // Use Promise.all to process meals concurrently for better performance if many meals per day
    const mealPromises = dayData.meals.map(async (mealData): Promise<MealRecommendation | null> => {
      // Ensure unique foods per meal
      const mealFoodIds = new Set<string>();
      const foodItemsToTransform: { foodId: string; mealType: string }[] = [];

      // Collect unique food items for this specific meal
      for (const [mealType, foodId] of Object.entries(mealData.meal_types)) {
        if (typeof foodId === "string" && foodId.trim() !== "") {
          const foodInfo = foodInfoMap.get(foodId); // Get pre-fetched info
          if (foodInfo) {
            if (!mealFoodIds.has(foodId)) {
              mealFoodIds.add(foodId);
              foodItemsToTransform.push({ foodId, mealType });
            } else {
               // Log duplicate within recommendation meal
               // console.log(`Skipping duplicate food ID '${foodId}' within recommendation meal '${mealData.meal_name}' on ${dateStr}.`);
            }
          } else {
            console.warn(`No pre-fetched info for recommended food ${foodId} (${mealType}). Skipping.`);
          }
        }
      }

      // Asynchronously transform unique food info for this meal
      const foodTransformPromises: Promise<Food | null>[] = foodItemsToTransform.map(
        ({ foodId, mealType }) => {
          const foodInfo = foodInfoMap.get(foodId)!; // We know it exists
          // Use the transformFoodInfo helper from recipeService
          return transformFoodInfo(foodInfo, mealType, foodId)
            .catch(error => {
              console.error(`Error transforming recommended food ${foodId} (${mealType}):`, error);
              return null; // Handle transformation error for individual food
            });
        }
      );

      // Wait for all food transformations for *this meal*
      const fetchedFoods = await Promise.all(foodTransformPromises);
      const mealFoods: Food[] = fetchedFoods.filter((food): food is Food => food !== null); // Filter out nulls

      if (mealFoods.length === 0) {
        console.warn(`Skipping recommendation for ${mealData.meal_name} on ${dateStr} as no valid food items were transformed.`);
        return null; // Return null if no foods for this meal
      }

      // Calculate combined nutritional info for the entire meal
      const combinedNutritionalInfo = calculateCombinedMealNutritionalInfo(mealFoods);

      // Determine overall meal diabetes friendliness
      const mealDiabetesFriendly = mealFoods.every((food) => food.diabetesFriendly);

      // Get meal time (use default if missing from API)
      const mealTime = mealData.meal_time || getDefaultMealTime(mealData.meal_name);

      // Calculate Recommendation Score
      // Use scores directly from the mealData object
      const varietyScore = mealData.variety_score ?? 0.5; // Default if missing
      const coverageScore = mealData.item_coverage_score ?? 0.5;
      const constraintScore = mealData.nutritional_constraint_score ?? 0.5;

      // Combine scores into a single 0-100 score (example weighting)
      const combinedScore = Math.round(
          (varietyScore * 0.2 + coverageScore * 0.3 + constraintScore * 0.5) * 100
      );
      const finalScore = Math.min(100, Math.max(0, combinedScore)); // Clamp between 0-100

      // Generate Dynamic Reasons & Benefits
      const reasons: string[] = [];
      const healthBenefits: string[] = [];

      // Add reasons based on scores
      if (finalScore >= 80) reasons.push("Excellent match for your profile!");
      else if (finalScore >= 60) reasons.push("Good match for your preferences.");
      if (constraintScore > 0.8) reasons.push("Aligns well with nutritional constraints.");
      else if (constraintScore < 0.4) reasons.push("May need review for nutritional alignment.");
      if (varietyScore > 0.8) reasons.push("Adds good variety.");
      if (coverageScore > 0.8) reasons.push("Covers requested meal components well.");

      // Add reasons/benefits based on nutrition and goals
      if (mealDiabetesFriendly) {
          reasons.push("Diabetes-friendly option.");
          healthBenefits.push("Supports stable blood sugar levels.");
      } else {
          reasons.push("Review nutritional info for diabetes suitability.");
      }
      if (combinedNutritionalInfo.fiber >= 7) { // Example threshold for high fiber meal
          reasons.push("High in fiber.");
          healthBenefits.push("Excellent source of dietary fiber.");
      } else if (combinedNutritionalInfo.fiber >= 4) {
          reasons.push("Good source of fiber.");
          healthBenefits.push("Contributes to daily fiber intake.");
      }
      if (combinedNutritionalInfo.protein >= 25) { // Example threshold for high protein meal
          reasons.push("High in protein.");
          healthBenefits.push("Supports muscle maintenance and satiety.");
      }
       if (userGoals) {
          const approxMealCalorieGoal = userGoals.dailyCalories / (dayData.meals.length || 3);
          if (combinedNutritionalInfo.calories < approxMealCalorieGoal * 0.8) reasons.push("Lower calorie option.");
          else if (combinedNutritionalInfo.calories > approxMealCalorieGoal * 1.2) reasons.push("Higher calorie option.");
      }
      if (reasons.length === 0) reasons.push("Balanced meal option.");


      // Create the complete Meal object
      const completeMeal: Meal = {
        // Generate a unique ID for this recommendation instance
        id: `rec-${dateStr}-${mealData.meal_name}-${mealData._id}`,
        originalBackendId: mealData._id, // Store the original backend ID for accept/reject actions
        name: `${
          mealData.meal_name.charAt(0).toUpperCase() +
          mealData.meal_name.slice(1)
        }`, // e.g., "Lunch"
        time: mealTime,
        type: mealData.meal_name.toLowerCase() as "breakfast" | "lunch" | "dinner" | "snack", // Ensure type safety
        foods: mealFoods,
        nutritionalInfo: combinedNutritionalInfo,
        diabetesFriendly: mealDiabetesFriendly,
        date: currentDate,
        score: finalScore,
      };

      // Create the MealRecommendation object
      const recommendationItem: MealRecommendation = {
        meal: completeMeal,
        score: finalScore, // Use the calculated score
        reasons: reasons, // Use dynamic reasons
        nutritionalImpact: {
          calories: combinedNutritionalInfo.calories,
          carbs: combinedNutritionalInfo.carbs,
          protein: combinedNutritionalInfo.protein,
          fiber: combinedNutritionalInfo.fiber,
        },
        healthBenefits: healthBenefits,
      };

      return recommendationItem; // Return the successfully created recommendation
    });

    // Wait for all meal promises for the current day to resolve
    const resolvedRecommendations = await Promise.all(mealPromises);

    // Filter out any null results (meals that failed transformation)
    resolvedRecommendations.forEach(rec => {
        if (rec) {
            dayRecommendations.recommendations.push(rec);
        }
    });


    // Add the completed day's recommendations if any exist
    if (dayRecommendations.recommendations.length > 0) {
        dayRecommendations.recommendations.sort((a, b) => a.meal.time.localeCompare(b.meal.time));
        recommendations.push(dayRecommendations);
    }
  }

  // Sort final list of days by date
  recommendations.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log("Transformed recommendations (Refactored):", recommendations.length, "days");
  return recommendations;
}

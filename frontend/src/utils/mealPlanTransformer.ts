import {
  DayRecommendations,
  Food,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
  Meal,
} from "../components/MealTimeline/types";
import { fetchRecipeInfo, fetchBeverageInfo } from "../services/recipeService";
import { parse } from "date-fns";

interface MealPlan {
  _id: string;
  user_id: string;
  name: string;
  days: {
    [date: string]: {
      _id: string;
      meals: Array<{
        _id: string;
        meal_time?: string;
        meal_name: string;
        meal_types: {
          beverage?: string;
          main_course?: string;
          side_dish?: string;
          dessert?: string;
        };
      }>;
      user_id: string;
      meal_plan_id: string;
    };
  };
}

interface R3Nutrient {
  measure: string;
  unit: string;
}

interface R3Macronutrients {
  Calories?: R3Nutrient;
  Carbohydrates?: R3Nutrient;
  Protein?: R3Nutrient;
  Fat?: R3Nutrient;
  "Saturated Fat"?: R3Nutrient;
  Cholesterol?: R3Nutrient;
  Sodium?: R3Nutrient;
  Potassium?: R3Nutrient;
  Fiber?: R3Nutrient;
  Sugar?: R3Nutrient;
  "Vitamin A"?: R3Nutrient;
  "Vitamin C"?: R3Nutrient;
  Calcium?: R3Nutrient;
  Iron?: R3Nutrient;
}

export function convertTime24to12(time24h: string): string {
  const [hours, minutes] = time24h.split(":");
  let hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${period}`;
}

function extractAllergensFromR3(r3Data: any): string[] {
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
}): NutritionalInfo {
  const macros = r3Data.macronutrients || {};

  // Helper function to safely parse numerical values
  const parseNutrientValue = (nutrient?: R3Nutrient): number => {
    if (!nutrient) return 0;
    const value = parseFloat(nutrient.measure);
    return isNaN(value) ? 0 : value;
  };

  // Calculate glycemic index based on carbs and fiber ratio
  // This is a simplified estimation
  // Adjust the formula in future
  const calculateGI = (carbs: number, fiber: number, sugar: number): number => {
    if (carbs === 0) return 0;
    const netCarbs = carbs - fiber;
    const sugarRatio = sugar / carbs;
    // Higher sugar ratio and lower fiber means higher GI
    return Math.min(
      100,
      Math.max(0, 55 + sugarRatio * 30 - (fiber / netCarbs) * 15)
    );
  };

  const calories = parseNutrientValue(macros.Calories);
  const carbs = parseNutrientValue(macros.Carbohydrates);
  const protein = parseNutrientValue(macros.Protein);
  const fat = parseNutrientValue(macros.Fat);
  const fiber = parseNutrientValue(macros.Fiber);
  const sugar = parseNutrientValue(macros.Sugar);

  const glycemicIndex = calculateGI(carbs, fiber, sugar);

  // Calculate glycemic load
  const glycemicLoad = Math.round((carbs * glycemicIndex) / 100);

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    glycemicIndex,
    glycemicLoad,
    sugarContent: sugar,
  };
}

export function isDiabetesFriendly(nutritionalInfo: NutritionalInfo): boolean {
  // TODO: These thresholds should be adjusted based on user input or medical guidelines
  const CARB_THRESHOLD = 45; // grams per meal
  const GI_THRESHOLD = 55; // medium GI threshold
  const FIBER_MINIMUM = 3; // grams per meal

  // Check if the meal meets diabetes-friendly criteria
  return (
    nutritionalInfo.carbs <= CARB_THRESHOLD &&
    (nutritionalInfo.glycemicIndex || 100) <= GI_THRESHOLD &&
    nutritionalInfo.fiber >= FIBER_MINIMUM &&
    (nutritionalInfo.sugarContent || 0) < nutritionalInfo.carbs * 0.25 // Sugar should be less than 25% of total carbs
  );
}

export function getDefaultMealTime(mealName: string): string {
  switch (mealName.toLowerCase()) {
    case "breakfast":
      return "08:00";
    case "lunch":
      return "12:30";
    case "dinner":
      return "18:30";
    case "snack":
      return "15:00";
    default:
      return "12:00"; // Default fallback time
  }
}

// Helper function to calculate combined nutritional info for a Meal
function calculateCombinedMealNutritionalInfo(foods: Food[]): NutritionalInfo {
  const initial: NutritionalInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    glycemicIndex: 0, // Will be calculated as weighted average
    glycemicLoad: 0, // Will be calculated based on total carbs and avg GI
    sugarContent: 0,
  };

  if (!foods || foods.length === 0) return initial;

  const combined = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + (food.nutritionalInfo?.calories || 0),
      protein: acc.protein + (food.nutritionalInfo?.protein || 0),
      carbs: acc.carbs + (food.nutritionalInfo?.carbs || 0),
      fat: acc.fat + (food.nutritionalInfo?.fat || 0),
      fiber: acc.fiber + (food.nutritionalInfo?.fiber || 0),
      sugarContent:
        acc.sugarContent || +(food.nutritionalInfo?.sugarContent || 0),
    }),
    initial
  );

  // Calculate average glycemic index weighted by carb content
  const totalCarbs = foods.reduce(
    (sum, food) => sum + (food.nutritionalInfo?.carbs || 0),
    0
  );

  const weightedGI =
    totalCarbs > 0
      ? foods.reduce((sum, food) => {
          const gi = food.nutritionalInfo?.glycemicIndex ?? 50; // Default to 50 if undefined
          const carbs = food.nutritionalInfo?.carbs || 0;
          return sum + gi * carbs; // Sum of (GI * Carbs)
        }, 0) / totalCarbs // Divide by total carbs
      : 0; // Avoid division by zero

  return {
    ...combined,
    glycemicIndex: parseFloat(weightedGI.toFixed(1)), // Keep one decimal place
    glycemicLoad: Math.round((combined.carbs * weightedGI) / 100),
  };
}

// Helper function to transform a single food item (recipe or beverage)
async function transformSingleFoodItem(
  foodId: string,
  mealType: string
): Promise<Food | null> {
  try {
    let foodInfo;
    const isBeverage = mealType === "beverage"; // Assume 'beverage' type indicates a beverage

    if (isBeverage) {
      foodInfo = await fetchBeverageInfo(foodId);
    } else {
      foodInfo = await fetchRecipeInfo(foodId);
    }

    if (!foodInfo) {
      console.warn(`No info found for ${mealType} with ID ${foodId}`);
      return null;
    }

    // Transform ingredients
    const ingredients: Ingredient[] =
      foodInfo.ingredients?.map((ing: any) => ({
        id: (ing.name || ing.ingredient_name || "unknown")
          .toLowerCase()
          .replace(/\s+/g, "-"),
        name: ing.name || ing.ingredient_name || "Unknown Ingredient",
        amount: parseFloat(ing.quantity?.measure) || 1,
        unit: ing.quantity?.unit || "unit",
        category: ing.category || "other",
        nutritionalInfo: calculateNutritionalInfo(ing), // Assuming calculateNutritionalInfo works for ingredients too
        allergens: ing.allergies?.category || [],
        culturalOrigin: foodInfo.cultural_origin || [], // Inherit from parent food if needed
        diabetesFriendly: true, // Placeholder: Needs proper calculation based on ingredient nutrition
      })) || [];

    const nutritionalInfo = calculateNutritionalInfo(foodInfo);

    // Transform food
    const food: Food = {
      id: foodId,
      name: foodInfo.recipe_name || foodInfo.name || "Unnamed Food",
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
      allergens: extractAllergensFromR3(foodInfo), // Use existing helper
    };

    return food;
  } catch (error) {
    console.error(`Error processing ${mealType} with ID ${foodId}:`, error);
    return null;
  }
}

export async function transformMealPlanToRecommendations(
  mealPlan: MealPlan
): Promise<DayRecommendations[]> {
  if (!mealPlan || !mealPlan.days) {
    console.error("Invalid meal plan data received for recommendations");
    return [];
  }

  const recommendations: DayRecommendations[] = [];

  // Iterate through each day in the meal plan
  for (const [dateStr, dayData] of Object.entries(mealPlan.days)) {
    const dayRecommendations: DayRecommendations = {
      date: parse(dateStr, "yyyy-MM-dd", new Date()),
      recommendations: [],
    };

    // Iterate through the meals array for the current day
    for (const mealData of dayData.meals) {
      const mealFoods: Food[] = [];
      const foodFetchPromises: Promise<Food | null>[] = [];

      // Collect all food items for this specific meal (e.g., Lunch)
      for (const [mealType, foodId] of Object.entries(mealData.meal_types)) {
        // Ensure foodId is a non-empty string
        if (typeof foodId === "string" && foodId.trim() !== "") {
          // Directly use the original foodId from the meal plan data
          foodFetchPromises.push(
            transformSingleFoodItem(foodId, mealType)
          );
        }
      }

      // Fetch and transform all food items for this meal in parallel
      const fetchedFoods = await Promise.all(foodFetchPromises);

      // Filter out any null results (due to errors)
      fetchedFoods.forEach((food) => {
        if (food) {
          mealFoods.push(food);
        }
      });

      // If no valid foods were found for this meal, skip creating a recommendation
      if (mealFoods.length === 0) {
        console.warn(
          `Skipping recommendation for ${mealData.meal_name} on ${dateStr} as no valid food items were found.`
        );
        continue;
      }

      // Calculate combined nutritional info for the entire meal
      const combinedNutritionalInfo =
        calculateCombinedMealNutritionalInfo(mealFoods);

      // Determine overall meal diabetes friendliness (e.g., if all foods are friendly)
      const mealDiabetesFriendly = mealFoods.every(
        (food) => food.diabetesFriendly
      );

      // Get default meal time based on meal name
      const mealTime = getDefaultMealTime(mealData.meal_name);

      // Create the complete Meal object
      const completeMeal: Meal = {
        id: `${dateStr}-${mealData.meal_name}-${mealData._id}-rec`, // Unique ID for the recommended meal
        name: `Recommended ${
          mealData.meal_name.charAt(0).toUpperCase() +
          mealData.meal_name.slice(1)
        }`, // e.g., "Recommended Lunch"
        time: mealTime,
        type: mealData.meal_name as "breakfast" | "lunch" | "dinner" | "snack", // Ensure type safety
        foods: mealFoods, // Array of all food items in this meal
        nutritionalInfo: combinedNutritionalInfo,
        diabetesFriendly: mealDiabetesFriendly,
        // TODO: Populate culturalTips and healthBenefits if available/calculable
        culturalTips: [],
        healthBenefits: [],
      };

      // Create a single MealRecommendation for this complete meal
      const recommendation: MealRecommendation = {
        meal: completeMeal,
        score: 85, // TODO: Calculate score based on user preferences, etc.
        reasons: [
          // TODO: Generate dynamic reasons
          "Matches your dietary preferences",
          "Good nutritional balance",
          mealDiabetesFriendly
            ? "Diabetes-friendly option"
            : "Review nutritional info",
        ],
        nutritionalImpact: {
          // TODO: Calculate impact relative to something? Or just show totals? For now, show totals.
          calories: combinedNutritionalInfo.calories,
          carbs: combinedNutritionalInfo.carbs,
          protein: combinedNutritionalInfo.protein,
          fiber: combinedNutritionalInfo.fiber,
        },
        healthBenefits: [
          // TODO: Generate dynamic benefits
          "Provides a mix of macronutrients",
          combinedNutritionalInfo.fiber > 5 ? "Good source of fiber" : "",
        ].filter((b) => b), // Filter out empty strings
      };

      // Add this single recommendation to the day's list
      dayRecommendations.recommendations.push(recommendation);
    }

    // Add the completed day's recommendations to the overall list
    if (dayRecommendations.recommendations.length > 0) {
      recommendations.push(dayRecommendations);
    }
  }

  console.log("Transformed recommendations:", recommendations);
  return recommendations;
}

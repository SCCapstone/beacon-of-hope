import {
  DayRecommendations,
  Food,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
} from "../components/MealTimeline/types";
import { fetchRecipeInfo, fetchBeverageInfo } from "../services/recipeService";
import { parse } from 'date-fns';

interface MealPlan {
  _id: string;
  user_id: string;
  name: string;
  days: {
    [date: string]: {
      _id: string;
      meals: Array<{
        _id: string;
        meal_time: string;
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

function convertTime12to24(time12h: string): string {
  const [time, modifier] = time12h.split(/([AaPp][Mm])/);
  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }

  if (modifier.toLowerCase() === "pm") {
    hours = String(parseInt(hours, 10) + 12);
  }

  return `${hours.padStart(2, "0")}:${minutes}`;
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

function calculateNutritionalInfo(r3Data: {
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
    // Additional optional properties:
    // saturatedFat: parseNutrientValue(macros["Saturated Fat"]),
    // cholesterol: parseNutrientValue(macros.Cholesterol),
    // sodium: parseNutrientValue(macros.Sodium),
    // potassium: parseNutrientValue(macros.Potassium),
    // vitaminA: parseNutrientValue(macros["Vitamin A"]),
    // vitaminC: parseNutrientValue(macros["Vitamin C"]),
    // calcium: parseNutrientValue(macros.Calcium),
    // iron: parseNutrientValue(macros.Iron),
  };
}

// Update the diabetes-friendly determination based on nutritional values
function isDiabetesFriendly(nutritionalInfo: NutritionalInfo): boolean {
  // These thresholds should be adjusted based on medical guidelines
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

export async function transformMealPlanToRecommendations(
  mealPlan: MealPlan
): Promise<DayRecommendations[]> {
  if (!mealPlan || !mealPlan.days) {
    console.error('Invalid meal plan data');
    return [];
  }

  const recommendations: DayRecommendations[] = [];

  for (const [dateStr, dayData] of Object.entries(mealPlan.days)) {
    const dayRecommendations: DayRecommendations = {
      date: parse(dateStr, 'yyyy-MM-dd', new Date()),
      recommendations: [],
    };

    // Iterate through the meals array in the day object
    for (const mealData of dayData.meals) {
      const mealRecommendations: MealRecommendation[] = [];

      // Process each meal type (main  course, side dish, etc.)
      for (const [mealType, foodId] of Object.entries(mealData.meal_types)) {
        try {
          let foodInfo;
          if (mealType === "beverage") {
            foodInfo = await fetchBeverageInfo(foodId);
          } else {
            foodInfo = await fetchRecipeInfo(foodId);
          }

          // Transform ingredients
          const ingredients: Ingredient[] = foodInfo.ingredients?.map(
            (ing: any) => ({
              id: (ing.name || ing.ingredient_name).toLowerCase().replace(/\s+/g, "-"),
              name: ing.name || ing.ingredient_name,
              amount: parseFloat(ing.quantity.measure) || 1,
              unit: ing.quantity.unit || "piece",
              category: ing.category || "other",
              nutritionalInfo: calculateNutritionalInfo(ing),
              allergens: ing.allergies?.category || [],
              culturalOrigin: foodInfo.cultural_origin || [],
              diabetesFriendly: true,
            })
          );

          // Transform food
          const food: Food = {
            id: foodId,
            name: foodInfo.recipe_name || foodInfo.name,
            type: mealType as
              | "main_course"
              | "side_dish"
              | "beverage"
              | "dessert"
              | "snack",
            ingredients,
            nutritionalInfo: calculateNutritionalInfo(foodInfo),
            diabetesFriendly: isDiabetesFriendly(
              calculateNutritionalInfo(foodInfo)
            ),
            preparationTime: parseInt(foodInfo.prep_time?.split(" ")[0] || "0"),
            cookingTime: parseInt(foodInfo.cook_time?.split(" ")[0] || "0"),
            instructions:
              foodInfo.instructions?.map((inst: any) => inst.original_text) ||
              [],
            culturalOrigin: foodInfo.cultural_origin || [],
            allergens: extractAllergensFromR3(foodInfo),
          };

          // Create meal recommendation
          const recommendation: MealRecommendation = {
            meal: {
              id: `${dateStr}-${mealData.meal_name}-${foodId}`,
              name: `${food.name} Meal`,
              time: convertTime12to24(mealData.meal_time),
              type: ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealData.meal_name) ? (mealData.meal_name as 'breakfast' | 'lunch' | 'dinner' | 'snack') : 'breakfast',
              foods: [food],
              nutritionalInfo: calculateNutritionalInfo(foodInfo),
              diabetesFriendly: isDiabetesFriendly(
                calculateNutritionalInfo(foodInfo)
              ),
              culturalTips: [],
              healthBenefits: [],
            },
            score: 85, //  TODO: To be calculated based on user preferences
            reasons: [
              "Matches your dietary preferences",
              "Good nutritional balance",
              "Diabetes-friendly option",
            ],
            nutritionalImpact: {
              calories: food.nutritionalInfo.calories,
              carbs: food.nutritionalInfo.carbs,
              protein: food.nutritionalInfo.protein,
              fiber: food.nutritionalInfo.fiber,
            },
            healthBenefits: [
              "Good source of protein",
              "Contains fiber for better blood sugar control",
              "Balanced macronutrients",
            ],
          };

          mealRecommendations.push(recommendation);
        } catch (error) {
          console.error(`Error processing food ID ${foodId}:`, error);
        }
      }

      dayRecommendations.recommendations.push(...mealRecommendations);
    }

    recommendations.push(dayRecommendations);
  }

  return recommendations;
}

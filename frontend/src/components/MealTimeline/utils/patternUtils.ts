import { DayMeals, PatternAnalysis, Meal, Food, Ingredient } from "../types";

export const analyzeTimePatterns = (meals: Meal[]): string[] => {
  const timePatterns: Map<string, number> = new Map();

  meals.forEach((meal) => {
    const hour = parseInt(meal.time.split(":")[0]);
    const timeSlot = getTimeSlot(hour);
    timePatterns.set(timeSlot, (timePatterns.get(timeSlot) || 0) + 1);
  });

  return Array.from(timePatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([slot, count]) => `${slot} (${count} times)`);
};

export const analyzeFoodCorrelations = (
  meals: Meal[]
): Array<{ food1: string; food2: string; correlation: number }> => {
  const foodPairs = new Map<string, number>();
  const foodCounts = new Map<string, number>();
  const culturalPairs = new Map<string, Set<string>>();

  meals.forEach((meal) => {
    meal.foods.forEach((food1) => {
      foodCounts.set(food1.name, (foodCounts.get(food1.name) || 0) + 1);

      // Track cultural patterns if available
      if (food1.culturalOrigin?.length) {
        food1.culturalOrigin.forEach((culture) => {
          if (!culturalPairs.has(culture)) {
            culturalPairs.set(culture, new Set());
          }
          culturalPairs.get(culture)?.add(food1.name);
        });
      }

      meal.foods.forEach((food2) => {
        if (food1.id !== food2.id) {
          const pairKey = [food1.name, food2.name].sort().join("-");
          foodPairs.set(pairKey, (foodPairs.get(pairKey) || 0) + 1);
        }
      });
    });
  });

  return Array.from(foodPairs.entries())
    .map(([pair, count]) => {
      const [food1, food2] = pair.split("-");
      const correlation =
        count /
        Math.min(foodCounts.get(food1) || 1, foodCounts.get(food2) || 1);
      return { food1, food2, correlation };
    })
    .sort((a, b) => b.correlation - a.correlation);
};

export const analyzeIngredientPatterns = (
  meals: Meal[]
): Map<string, { frequency: number; meals: string[] }> => {
  const patterns = new Map<string, { frequency: number; meals: string[] }>();

  meals.forEach((meal) => {
    meal.foods.forEach((food) => {
      food.ingredients.forEach((ing) => {
        const current = patterns.get(ing.name) || { frequency: 0, meals: [] };
        patterns.set(ing.name, {
          frequency: current.frequency + 1,
          meals: [...new Set([...current.meals, meal.name])],
        });
      });
    });
  });

  return patterns;
};

export const generateHealthInsights = (
  meals: Meal[],
  diabetesFriendly: boolean = false
): string[] => {
  const insights: string[] = [];

  // Calculate average glycemic impact
  const glycemicImpact =
    meals.reduce((acc, meal) => {
      const mealGI =
        meal.foods.reduce((sum, food) => {
          return sum + (food.nutritionalInfo.glycemicIndex || 70); // Default to high if not specified
        }, 0) / meal.foods.length;
      return acc + mealGI;
    }, 0) / meals.length;

  // Analyze nutritional balance
  const avgNutrition = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.nutritionalInfo.calories,
      carbs: acc.carbs + meal.nutritionalInfo.carbs,
      protein: acc.protein + meal.nutritionalInfo.protein,
      fat: acc.fat + meal.nutritionalInfo.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );

  const mealCount = meals.length;
  const avgCalories = avgNutrition.calories / mealCount;
  const avgCarbs = avgNutrition.carbs / mealCount;

  if (diabetesFriendly) {
    if (avgCarbs > 45) {
      insights.push("Consider reducing carbohydrate intake per meal");
    }
    if (avgCalories > 500) {
      insights.push(
        "Consider smaller portion sizes for better glucose control"
      );
    }
    if (glycemicImpact > 55) {
      insights.push("Consider lower glycemic index alternatives");
    } else if (glycemicImpact <= 55) {
      insights.push("Good glycemic profile maintained");
    }
  }

  return insights;
};

// Helper function
const getTimeSlot = (hour: number): string => {
  if (hour < 10) return "Morning";
  if (hour < 14) return "Midday";
  if (hour < 18) return "Afternoon";
  return "Evening";
};

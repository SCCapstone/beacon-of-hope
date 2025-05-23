import { DayMeals } from "./types";

export const calculateCurrentNutritionalValues = (weekData: DayMeals[]) => {
  if (!weekData.length) {
    return {
      calories: 0,
      carbs: 0,
      protein: 0,
      fiber: 0,
    };
  }

  const totals = weekData.reduce(
    (acc, day) => {
      const dayTotals = day.meals.reduce(
        (mealAcc, meal) => ({
          calories: mealAcc.calories + (meal.nutritionalInfo?.calories || 0),
          carbs: mealAcc.carbs + (meal.nutritionalInfo?.carbs || 0),
          protein: mealAcc.protein + (meal.nutritionalInfo?.protein || 0),
          fiber: mealAcc.fiber + (meal.nutritionalInfo?.fiber || 0),
        }),
        {
          calories: 0,
          carbs: 0,
          protein: 0,
          fiber: 0,
        }
      );

      return {
        calories: acc.calories + dayTotals.calories,
        carbs: acc.carbs + dayTotals.carbs,
        protein: acc.protein + dayTotals.protein,
        fiber: acc.fiber + dayTotals.fiber,
      };
    },
    {
      calories: 0,
      carbs: 0,
      protein: 0,
      fiber: 0,
    }
  );

  // Calculate daily averages
  const numberOfDays = weekData.length || 1; // Prevent division by zero
  return {
    calories: Math.round(totals.calories / numberOfDays),
    carbs: Math.round(totals.carbs / numberOfDays),
    protein: Math.round(totals.protein / numberOfDays),
    fiber: Math.round(totals.fiber / numberOfDays),
  };
};

// Helper to format score
export const formatScore = (score: number | undefined | null): string => {
  if (score === undefined || score === null) return "N/A";
  // Ensure score is treated as a number before calling toFixed
  const numericScore = Number(score);
  if (isNaN(numericScore)) return "N/A";
  return numericScore.toFixed(2); // Display as decimal, e.g., 0.75
  // Or display as percentage: return `${(numericScore * 100).toFixed(0)}%`;
};

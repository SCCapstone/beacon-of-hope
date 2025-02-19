import { useState, useEffect } from "react";
import { DayMeals, PatternAnalysis, MealPattern } from "../types";
interface HealthMetrics {
  glycemicLoad: number;
  fiberIntake: number;
  proteinDistribution: number;
  mealTiming: {
    consistent: boolean;
    avgGaps: number;
  };
  nutrientBalance: {
    protein: number;
    carbs: number;
    fats: number;
  };
  culturalAdherence: number;
  allergensExposure: string[];
}

export const usePatternAnalysis = (weekData: DayMeals[]) => {
  const [patterns, setPatterns] = useState<MealPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyzeHealthMetrics = (data: DayMeals[]): HealthMetrics => {
    let totalMeals = 0;
    let glycemicLoadSum = 0;
    let fiberSum = 0;
    let proteinSum = 0;
    const mealTimes: number[] = [];
    const nutrientSums = { protein: 0, carbs: 0, fats: 0 };
    const allergenExposures = new Set<string>();

    data.forEach((day) => {
      const dayMealTimes: number[] = [];

      day.meals.forEach((meal) => {
        totalMeals++;

        // Convert meal time to minutes since midnight for timing analysis
        const [hours, minutes] = meal.time.split(":").map(Number);
        dayMealTimes.push(hours * 60 + minutes);

        // Analyze meal components
        meal.foods.forEach((food) => {
          // Glycemic load calculation
          const gl = food.nutritionalInfo.glycemicIndex
            ? (food.nutritionalInfo.glycemicIndex *
                food.nutritionalInfo.carbs) /
              100
            : 0;
          glycemicLoadSum += gl;

          // Nutrient tracking
          nutrientSums.protein += food.nutritionalInfo.protein;
          nutrientSums.carbs += food.nutritionalInfo.carbs;
          nutrientSums.fats += food.nutritionalInfo.fat;
          fiberSum += food.nutritionalInfo.fiber;

          // Track allergens
          food.allergens.forEach((allergen) => allergenExposures.add(allergen));
        });
      });

      // Calculate time gaps between meals
      if (dayMealTimes.length > 1) {
        dayMealTimes.sort((a, b) => a - b);
        for (let i = 1; i < dayMealTimes.length; i++) {
          mealTimes.push(dayMealTimes[i] - dayMealTimes[i - 1]);
        }
      }
    });

    // Calculate averages and metrics
    const avgGapBetweenMeals = mealTimes.length
      ? mealTimes.reduce((sum, gap) => sum + gap, 0) / mealTimes.length
      : 0;

    const gapConsistency = mealTimes.length
      ? Math.sqrt(
          mealTimes.reduce(
            (sum, gap) => sum + Math.pow(gap - avgGapBetweenMeals, 2),
            0
          ) / mealTimes.length
        ) < 60 // Less than 1 hour standard deviation
      : false;

    const totalCalories =
      nutrientSums.protein * 4 + nutrientSums.carbs * 4 + nutrientSums.fats * 9;

    return {
      glycemicLoad: glycemicLoadSum / totalMeals,
      fiberIntake: fiberSum / data.length, // Daily average
      proteinDistribution: ((nutrientSums.protein * 4) / totalCalories) * 100,
      mealTiming: {
        consistent: gapConsistency,
        avgGaps: avgGapBetweenMeals,
      },
      nutrientBalance: {
        protein: ((nutrientSums.protein * 4) / totalCalories) * 100,
        carbs: ((nutrientSums.carbs * 4) / totalCalories) * 100,
        fats: ((nutrientSums.fats * 9) / totalCalories) * 100,
      },
      culturalAdherence: calculateCulturalAdherence(data),
      allergensExposure: Array.from(allergenExposures),
    };
  };

  const generateHealthInsights = (metrics: HealthMetrics): string[] => {
    const insights: string[] = [];

    // Glycemic Load Insights
    if (metrics.glycemicLoad > 20) {
      insights.push(
        "Consider reducing high-glycemic foods to better manage blood sugar levels"
      );
    } else if (metrics.glycemicLoad < 10) {
      insights.push("Your meals have a good glycemic profile");
    }

    // Fiber Insights
    if (metrics.fiberIntake < 25) {
      insights.push(
        "Consider increasing fiber intake through whole grains, legumes, and vegetables"
      );
    } else {
      insights.push("Good job maintaining adequate fiber intake");
    }

    // Protein Distribution
    if (metrics.proteinDistribution < 15) {
      insights.push("Consider including more protein sources in your meals");
    } else if (metrics.proteinDistribution > 35) {
      insights.push("Your protein intake is high - ensure balanced nutrition");
    }

    // Meal Timing
    if (!metrics.mealTiming.consistent) {
      insights.push("More consistent meal timing may help regulate metabolism");
    }
    if (metrics.mealTiming.avgGaps > 300) {
      // 5 hours
      insights.push("Consider adding healthy snacks between meals");
    }

    // Nutrient Balance
    const { protein, carbs, fats } = metrics.nutrientBalance;
    if (Math.abs(carbs - 50) > 15) {
      insights.push(
        `Carbohydrate intake is ${
          carbs > 50 ? "high" : "low"
        } - aim for balance`
      );
    }
    if (fats < 20) {
      insights.push(
        "Consider including healthy fats for better nutrient absorption"
      );
    }

    return insights;
  };

  const calculateCulturalAdherence = (data: DayMeals[]): number => {
    // Implementation for cultural food pattern analysis
    // Returns a percentage of meals that align with preferred cultural preferences
    return 0; // Placeholder
  };

  useEffect(() => {
    const analyzePatterns = () => {
      try {
        setLoading(true);

        const healthMetrics = analyzeHealthMetrics(weekData);
        const healthInsights = generateHealthInsights(healthMetrics);

        // Initialize pattern containers
        const mealPatterns: PatternAnalysis[] = [];
        const foodPatterns: PatternAnalysis[] = [];
        const ingredientPatterns: PatternAnalysis[] = [];

        // Analyze meal patterns
        const mealFrequency = new Map<string, number>();
        const mealTimePatterns = new Map<string, Set<string>>();

        weekData.forEach((day) => {
          day.meals.forEach((meal) => {
            // Analyze meal frequency
            mealFrequency.set(
              meal.type,
              (mealFrequency.get(meal.type) || 0) + 1
            );

            // Analyze meal timing
            const timeKey = `${meal.type}-${meal.time}`;
            if (!mealTimePatterns.has(timeKey)) {
              mealTimePatterns.set(timeKey, new Set());
            }
            mealTimePatterns.get(timeKey)?.add(day.date);

            // Analyze food patterns within meals
            meal.foods.forEach((food) => {
              // Food frequency analysis
              const foodKey = `${food.type}-${food.name}`;
              foodPatterns.push({
                type: "food",
                frequency: 1,
                timePattern: meal.time,
                correlation: {
                  with: meal.type,
                  strength: 1,
                  type: "positive",
                },
              });

              // Ingredient analysis
              food.ingredients.forEach((ingredient) => {
                ingredientPatterns.push({
                  type: "ingredient",
                  frequency: 1,
                  correlation: {
                    with: food.name,
                    strength: 1,
                    type: "positive",
                  },
                });
              });
            });
          });
        });

        // Process patterns into insights
        const pattern: MealPattern = {
          patterns: [], // Your existing pattern analysis
          recommendations: healthInsights,
          healthInsights: {
            diabetesImpact: `Glycemic Load: ${healthMetrics.glycemicLoad.toFixed(
              1
            )} - ${
              healthMetrics.glycemicLoad < 15 ? "Good" : "Needs attention"
            }`,
            culturalAlignment: `Cultural adherence: ${healthMetrics.culturalAdherence.toFixed(
              1
            )}%`,
            nutritionalBalance: `Protein: ${healthMetrics.nutrientBalance.protein.toFixed(
              1
            )}% | 
              Carbs: ${healthMetrics.nutrientBalance.carbs.toFixed(1)}% | 
              Fats: ${healthMetrics.nutrientBalance.fats.toFixed(1)}%`,
          },
        };

        setPatterns(pattern);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error analyzing patterns"
        );
      } finally {
        setLoading(false);
      }
    };

    analyzePatterns();
  }, [weekData]);

  return { patterns, loading, error };
};

// Helper functions
function generateRecommendations(
  mealPatterns: PatternAnalysis[],
  foodPatterns: PatternAnalysis[],
  ingredientPatterns: PatternAnalysis[]
): string[] {
  const recommendations: string[] = [];

  // Analyze meal timing consistency
  if (mealPatterns.some((p) => p.frequency < 5)) {
    recommendations.push("Consider maintaining more consistent meal times");
  }

  // Analyze food variety
  if (foodPatterns.length < 10) {
    recommendations.push("Try incorporating more variety in your meals");
  }

  // Analyze nutritional balance
  const hasProtein = ingredientPatterns.some((p) => p.type === "protein");
  const hasVegetables = ingredientPatterns.some((p) => p.type === "vegetable");

  if (!hasProtein) recommendations.push("Consider adding more protein sources");
  if (!hasVegetables) recommendations.push("Try to include more vegetables");

  return recommendations;
}

function analyzeDiabetesImpact(weekData: DayMeals[]): string {
  let highGICount = 0;
  let totalMeals = 0;

  weekData.forEach((day) => {
    day.meals.forEach((meal) => {
      totalMeals++;
      const averageGI =
        meal.foods.reduce((sum, food) => {
          return sum + (food.nutritionalInfo.glycemicIndex || 0);
        }, 0) / meal.foods.length;

      if (averageGI > 70) highGICount++;
    });
  });

  const highGIPercentage = (highGICount / totalMeals) * 100;

  if (highGIPercentage > 30) {
    return "Consider reducing high glycemic index foods";
  } else if (highGIPercentage > 15) {
    return "Moderate glycemic index profile";
  } else {
    return "Good glycemic index profile";
  }
}

function analyzeCulturalAlignment(weekData: DayMeals[]): string {
  // Implement cultural alignment analysis
  return "Cultural alignment analysis available";
}

function analyzeNutritionalBalance(weekData: DayMeals[]): string {
  // Implement nutritional balance analysis
  return "Nutritional balance analysis available";
}

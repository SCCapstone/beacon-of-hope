import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DayMeals, Food, NutritionalInfo } from "../types";
import { COLOR_SCHEMES } from "../constants";
import { format } from "date-fns";

interface FoodViewProps {
  weekData: DayMeals[];
  onFoodSelect: (food: Food | null) => void;
  selectedFood: Food | null;
}

export const FoodView: React.FC<FoodViewProps> = ({
  weekData,
  onFoodSelect,
  selectedFood,
}) => {
  // Analyze food patterns across the week
  const foodAnalysis = useMemo(() => {
    const allFoods = weekData.flatMap((day) =>
      day.meals.flatMap((meal) => meal.foods)
    );

    // Count food occurrences and calculate averages
    const foodStats = new Map<
      string,
      {
        count: number;
        pattern: string[];
        avgNutrition: NutritionalInfo;
      }
    >();

    allFoods.forEach((food) => {
      const existing = foodStats.get(food.id) || {
        count: 0,
        pattern: [],
        avgNutrition: { ...food.nutritionalInfo },
      };

      // Determine food patterns
      const patterns: string[] = [];
      const n = food.nutritionalInfo;
      if (n.protein > 20) patterns.push("high_protein");
      if (n.carbs > 40) patterns.push("high_carb");
      if (n.fiber > 5) patterns.push("high_fiber");
      if (n.calories < 300) patterns.push("low_calorie");

      foodStats.set(food.id, {
        count: existing.count + 1,
        pattern: patterns,
        avgNutrition: existing.avgNutrition,
      });
    });

    return foodStats;
  }, [weekData]);

  // Get pattern color
  const getPatternColor = (patterns: string[]): string => {
    if (patterns.length === 0) return "#f3f4f6";

    const colorMap = {
      high_protein: "#ef4444",
      high_carb: "#f59e0b",
      high_fiber: "#10b981",
      low_calorie: "#8b5cf6",
    };

    return colorMap[patterns[0] as keyof typeof colorMap] || "#f3f4f6";
  };

  return (
    <div className="p-4">
      {/* Pattern Summary */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {["high_protein", "high_carb", "high_fiber", "low_calorie"].map(
          (pattern) => (
            <div
              key={pattern}
              className="p-3 rounded-lg bg-white shadow-sm"
              style={{ borderLeft: `4px solid ${getPatternColor([pattern])}` }}
            >
              <div className="text-sm font-medium capitalize">
                {pattern.replace("_", " ")}
              </div>
              <div className="text-2xl font-bold">
                {
                  Array.from(foodAnalysis.values()).filter((stats) =>
                    stats.pattern.includes(pattern)
                  ).length
                }
              </div>
            </div>
          )
        )}
      </div>

      {/* Weekly Calendar View */}
      <div className="grid grid-cols-7 gap-4">
        {weekData.map((day) => (
          <div key={day.date.toString()} className="space-y-2">
            <div className="text-sm font-medium">
              {format(new Date(day.date), "EEE, MMM d")}
            </div>

            {day.meals.map((meal) => (
              <div key={meal.id} className="p-2 rounded-lg bg-white shadow-sm">
                <div className="text-xs text-gray-500 mb-1">
                  {meal.time} - {meal.type}
                </div>

                {meal.foods.map((food) => {
                  const stats = foodAnalysis.get(food.id);
                  const patterns = stats?.pattern || [];

                  return (
                    <motion.div
                      key={food.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onFoodSelect(food)}
                      className={`p-2 rounded cursor-pointer ${
                        selectedFood?.id === food.id
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                      style={{
                        backgroundColor: getPatternColor(patterns),
                        opacity: patterns.length ? 0.8 : 0.5,
                      }}
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {food.name}
                      </div>
                      {patterns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patterns.map((pattern) => (
                            <span
                              key={pattern}
                              className="text-xs px-1.5 py-0.5 rounded-full bg-white/50"
                            >
                              {pattern.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Selected Food Details */}
      {selectedFood && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4"
        >
          <h3 className="font-medium text-lg mb-2">{selectedFood.name}</h3>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Calories: {selectedFood.nutritionalInfo.calories}</div>
              <div>Protein: {selectedFood.nutritionalInfo.protein}g</div>
              <div>Carbs: {selectedFood.nutritionalInfo.carbs}g</div>
              <div>Fiber: {selectedFood.nutritionalInfo.fiber}g</div>
            </div>

            <div className="text-sm">
              <div className="font-medium mt-2">Ingredients:</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedFood.ingredients.map((ing) => (
                  <span
                    key={ing.id}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                  >
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>

            {selectedFood.diabetesFriendly && (
              <div className="text-sm text-green-600 mt-2">
                ✓ Diabetes-Friendly
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

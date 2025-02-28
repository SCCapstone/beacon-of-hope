import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DayMeals, Food, NutritionalInfo } from "../types";
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
  // Helper function to get food cultural info
  const getFoodCulturalInfo = (food: Food): string[] => {
    if (food.culturalOrigin?.length) return food.culturalOrigin;
    
    // Try to infer from ingredients
    const cultures = new Set<string>();
    food.ingredients.forEach(ing => {
      ing.culturalOrigin?.forEach(culture => cultures.add(culture));
    });
    return Array.from(cultures);
  };

  // Helper function to calculate diabetes friendliness
  const calculateDiabetesFriendliness = (food: Food): {
    isDiabetesFriendly: boolean;
    reason: string;
  } => {
    if (food.diabetesFriendly !== undefined) {
      return {
        isDiabetesFriendly: food.diabetesFriendly,
        reason: food.diabetesFriendly 
          ? "Marked as diabetes-friendly"
          : "Not marked as diabetes-friendly"
      };
    }

    // Calculate based on nutritional values
    const carbsPerServing = food.nutritionalInfo.carbs;
    const fiberContent = food.nutritionalInfo.fiber || 0;
    const avgGI = food.nutritionalInfo.glycemicIndex || 
      food.ingredients.reduce((sum, ing) => 
        sum + (ing.nutritionalInfo.glycemicIndex || 70), 0) / food.ingredients.length;

    const isDiabetesFriendly = 
      carbsPerServing <= 30 && 
      fiberContent >= 3 && 
      avgGI < 55;

    return {
      isDiabetesFriendly,
      reason: isDiabetesFriendly
        ? "Based on nutritional profile"
        : "Consider portion control"
    };
  };

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
        diabetesFriendly?: boolean;
        culturalInfo: string[];
        mealTypes: Set<string>;
        timeSlots: Set<string>;
      }
    >();

    allFoods.forEach((food) => {
      const existing = foodStats.get(food.id) || {
        count: 0,
        pattern: [],
        avgNutrition: { ...food.nutritionalInfo },
        diabetesFriendly: food.diabetesFriendly,
        culturalInfo: getFoodCulturalInfo(food),
        mealTypes: new Set<string>(),
        timeSlots: new Set<string>(),
      };

      // Determine food patterns
      const patterns: string[] = [];
      const n = food.nutritionalInfo;
      if (n.protein > 20) patterns.push("high_protein");
      if (n.carbs > 40) patterns.push("high_carb");
      if (n.fiber && n.fiber > 5) patterns.push("high_fiber");
      if (n.calories < 300) patterns.push("low_calorie");

      // Update existing stats
      existing.count += 1;
      existing.pattern = patterns;
      existing.mealTypes.add(food.type);

      foodStats.set(food.id, existing);
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
                  const diabetesProfile = calculateDiabetesFriendliness(food);
                  const culturalInfo = getFoodCulturalInfo(food);

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
                      {/* Food Name and Type */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {food.name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {food.type.replace("_", " ")}
                          </div>
                        </div>
                        
                        {/* Diabetes Friendliness Indicator */}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            diabetesProfile.isDiabetesFriendly
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {diabetesProfile.isDiabetesFriendly ? "DF" : "Monitor"}
                        </span>
                      </div>

                      {/* Nutritional Quick View */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                        <div>
                          Calories: {food.nutritionalInfo.calories}
                        </div>
                        <div>
                          Carbs: {food.nutritionalInfo.carbs}g
                        </div>
                        {food.nutritionalInfo.glycemicIndex && (
                          <div>
                            GI: {food.nutritionalInfo.glycemicIndex}
                          </div>
                        )}
                        {food.nutritionalInfo.fiber && (
                          <div>
                            Fiber: {food.nutritionalInfo.fiber}g
                          </div>
                        )}
                      </div>

                      {/* Patterns and Tags */}
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

                      {/* Cultural Information */}
                      {culturalInfo.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {culturalInfo.map((culture) => (
                            <span
                              key={culture}
                              className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800"
                            >
                              {culture.replace("_", " ")}
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
          className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg p-4"
        >
          <h3 className="font-medium text-lg mb-2">{selectedFood.name}</h3>

          <div className="space-y-4">
            {/* Nutritional Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Nutritional Information
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: {selectedFood.nutritionalInfo.calories}</div>
                <div>Protein: {selectedFood.nutritionalInfo.protein}g</div>
                <div>Carbs: {selectedFood.nutritionalInfo.carbs}g</div>
                {selectedFood.nutritionalInfo.fiber && (
                  <div>Fiber: {selectedFood.nutritionalInfo.fiber}g</div>
                )}
                {selectedFood.nutritionalInfo.glycemicIndex && (
                  <div>
                    Glycemic Index: {selectedFood.nutritionalInfo.glycemicIndex}
                  </div>
                )}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Ingredients
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedFood.ingredients.map((ing) => (
                  <span
                    key={ing.id}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                  >
                    {ing.name} ({ing.amount}{ing.unit})
                  </span>
                ))}
              </div>
            </div>

            {/* Preparation Info */}
            <div className="flex gap-4 text-sm text-gray-600">
              <div>Prep: {selectedFood.preparationTime}min</div>
              <div>Cook: {selectedFood.cookingTime}min</div>
            </div>

            {/* Health Information */}
            <div className="space-y-2">
              {/* Diabetes Friendliness */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    calculateDiabetesFriendliness(selectedFood).isDiabetesFriendly
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {calculateDiabetesFriendliness(selectedFood).reason}
                </span>
              </div>

              {/* Allergens */}
              {selectedFood.allergens.length > 0 && (
                <div className="text-sm text-red-600">
                  Contains: {selectedFood.allergens.join(", ")}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

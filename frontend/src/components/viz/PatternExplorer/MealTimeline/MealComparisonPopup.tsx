// MealComparisonPopup.tsx
import React, { useMemo } from "react";
import { Meal } from "./types";
import { motion } from "framer-motion";

interface MealComparisonPopupProps {
  meal1: Meal;
  meal2: Meal;
  onClose: () => void;
}

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const MealComparisonPopup: React.FC<MealComparisonPopupProps> = ({
  meal1,
  meal2,
  onClose,
}) => {
  // Calculate mock nutrition info (replace with real calculations)
  const calculateNutrition = (meal: Meal): NutritionInfo => {
    // Mock calculation - replace with actual nutrition calculation logic
    return {
      calories: Math.round(
        meal.ingredients.reduce((sum, ing) => sum + ing.amount * 2, 0)
      ),
      protein: Math.round(
        meal.ingredients.reduce((sum, ing) => sum + ing.amount * 0.1, 0)
      ),
      carbs: Math.round(
        meal.ingredients.reduce((sum, ing) => sum + ing.amount * 0.2, 0)
      ),
      fat: Math.round(
        meal.ingredients.reduce((sum, ing) => sum + ing.amount * 0.1, 0)
      ),
      fiber: Math.round(
        meal.ingredients.reduce((sum, ing) => sum + ing.amount * 0.05, 0)
      ),
    };
  };

  {
    /* TODO: Implement actual nutrition calculation logic later. Some example code below:
  import { getNutritionalInfo } from './nutritionAPI'; // Some nutritional info fetching function

  const calculateNutrition = async (meal: Meal): Promise<NutritionInfo> => {
    const nutritionInfo: NutritionInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };

    for (const ingredient of meal.ingredients) {
      const info = await getNutritionalInfo(ingredient.name);
      nutritionInfo.calories += info.calories * ingredient.amount;
      nutritionInfo.protein += info.protein * ingredient.amount;
      nutritionInfo.carbs += info.carbs * ingredient.amount;
      nutritionInfo.fat += info.fat * ingredient.amount;
      nutritionInfo.fiber += info.fiber * ingredient.amount;
    }

    // Round the values
    nutritionInfo.calories = Math.round(nutritionInfo.calories);
    nutritionInfo.protein = Math.round(nutritionInfo.protein);
    nutritionInfo.carbs = Math.round(nutritionInfo.carbs);
    nutritionInfo.fat = Math.round(nutritionInfo.fat);
    nutritionInfo.fiber = Math.round(nutritionInfo.fiber);

    return nutritionInfo;
  };
  */
  }

  const nutrition1 = calculateNutrition(meal1);
  const nutrition2 = calculateNutrition(meal2);

  // Process ingredients for comparison
  const ingredientComparison = useMemo(() => {
    const allIngredients = new Map<
      string,
      {
        meal1: number;
        meal2: number;
        unit: string;
        category: string;
      }
    >();

    meal1.ingredients.forEach((ing) => {
      allIngredients.set(ing.name, {
        meal1: ing.amount,
        meal2: 0,
        unit: ing.unit,
        category: ing.category,
      });
    });

    meal2.ingredients.forEach((ing) => {
      const existing = allIngredients.get(ing.name);
      if (existing) {
        existing.meal2 = ing.amount;
      } else {
        allIngredients.set(ing.name, {
          meal1: 0,
          meal2: ing.amount,
          unit: ing.unit,
          category: ing.category,
        });
      }
    });

    return Array.from(allIngredients.entries());
  }, [meal1, meal2]);

  // Calculate percentages for bars
  const maxAmount = Math.max(
    ...ingredientComparison.map(([_, amounts]) =>
      Math.max(amounts.meal1, amounts.meal2)
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Meal Comparison
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Meal Headers */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-xl text-blue-900 mb-2">
                {meal1.name}
              </h3>
              <p className="text-blue-700">{meal1.time}</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <h3 className="font-semibold text-xl text-amber-900 mb-2">
                {meal2.name}
              </h3>
              <p className="text-amber-700">{meal2.time}</p>
            </div>
          </div>

          {/* Nutrition Comparison */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Nutrition Comparison
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Compare key nutritional values between meals. <br />{" "}
              <i>
                Blue numbers show first meal's values, amber numbers show second
                meal's values, and the middle number shows the difference (green
                for increase, red for decrease).
              </i>
            </p>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(nutrition1).map(([key, value1]) => {
                const value2 = nutrition2[key as keyof NutritionInfo];
                const diff = value2 - value1;
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 capitalize mb-2">
                      {key}
                    </h4>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-semibold">
                        {value1}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          diff > 0
                            ? "text-green-600 bg-green-50 border border-green-200"
                            : diff < 0
                            ? "text-red-600 bg-red-50 border border-red-200"
                            : "text-gray-600 bg-gray-50 border border-gray-200"
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                      <span className="text-amber-600 font-semibold">
                        {value2}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ingredient Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Ingredient Comparison
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Compare ingredient amounts side by side. <br />{" "}
              <i>
                Blue bars show first meal's amounts, amber bars show second
                meal's amounts. Arrows indicate changes in quantity between
                meals.
              </i>
            </p>
            <div className="space-y-4">
              {ingredientComparison.map(([ingredient, amounts]) => (
                <div key={ingredient} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700 capitalize">
                      {ingredient}
                    </span>
                    <span className="text-sm text-gray-500">
                      {amounts.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Meal 1 Bar */}
                    <div className="w-[40%] flex justify-end items-center gap-2">
                      <span className="text-sm text-blue-700 font-medium">
                        {amounts.meal1} {amounts.unit}
                      </span>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(amounts.meal1 / maxAmount) * 100}%`,
                        }}
                        className="h-6 bg-blue-400 rounded"
                      />
                    </div>

                    {/* Difference Indicator */}
                    <div className="w-[20%] flex justify-center">
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded ${
                          amounts.meal2 > amounts.meal1
                            ? "text-green-600 bg-green-50 border border-green-200"
                            : amounts.meal2 < amounts.meal1
                            ? "text-red-600 bg-red-50 border border-red-200"
                            : "text-gray-600 bg-gray-50 border border-gray-200"
                        }`}
                      >
                        {amounts.meal2 > amounts.meal1
                          ? "↑"
                          : amounts.meal2 < amounts.meal1
                          ? "↓"
                          : "="}
                        {Math.abs(amounts.meal2 - amounts.meal1)} {amounts.unit}
                      </span>
                    </div>

                    {/* Meal 2 Bar */}
                    <div className="w-[40%] flex items-center gap-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(amounts.meal2 / maxAmount) * 100}%`,
                        }}
                        className="h-6 bg-amber-400 rounded"
                      />
                      <span className="text-sm text-amber-700 font-medium">
                        {amounts.meal2} {amounts.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Key Differences
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Shows the 6 ingredients with the largest quantity differences
              between meals.
              <br />
              <i>
                Green indicates higher amount and red indicates
                lower amount in second meal
              </i>
            </p>
            <div className="grid grid-cols-2 gap-4">
              {ingredientComparison
                .filter(([_, amounts]) => amounts.meal1 !== amounts.meal2)
                .sort(
                  (a, b) =>
                    Math.abs(b[1].meal2 - b[1].meal1) -
                    Math.abs(a[1].meal2 - a[1].meal1)
                )
                .slice(0, 6)
                .map(([ingredient, amounts]) => (
                  <div
                    key={ingredient}
                    className="flex justify-between p-3 bg-white rounded-lg shadow-sm"
                  >
                    <span className="text-gray-700">{ingredient}</span>
                    <span
                      className={`font-medium ${
                        amounts.meal2 > amounts.meal1
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {amounts.meal2 > amounts.meal1 ? "+" : "-"}
                      {Math.abs(amounts.meal2 - amounts.meal1)} {amounts.unit}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MealComparisonPopup;

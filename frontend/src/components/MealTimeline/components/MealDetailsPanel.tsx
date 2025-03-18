import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Meal } from "../types";
import { COLOR_SCHEMES } from "../constants";
import { MealRecommendation } from "../types";
import { getDefaultMealTime } from "../../../utils/mealPlanTransformer";

interface MealDetailsPanelProps {
  meal: Meal | null;
  recommendation: MealRecommendation | null;
  onClose: () => void;
  nutritionalGoals: {
    dailyCalories: number;
    carbohydrates: { min: number; max: number; unit: string };
    protein: { min: number; max: number; unit: string };
    fiber: { daily: number; unit: string };
  };
  currentNutritionalValues: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  baseNutritionalValues: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  selectedDate: Date;
}

export const MealDetailsPanel: React.FC<MealDetailsPanelProps> = ({
  meal,
  recommendation,
  onClose,
  nutritionalGoals,
  currentNutritionalValues,
  baseNutritionalValues,
  selectedDate,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="pb-24">
          <AnimatePresence mode="wait">
            {meal ? (
              // Meal Details View
              <motion.div
                key="meal-details"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="h-full"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-white z-10 shadow-sm">
                  <div className="flex justify-between items-center p-4 border-b">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {meal.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}{" "}
                        {meal.time || getDefaultMealTime(meal.type)}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg
                        className="w-6 h-6 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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

                {/* Foods */}
                <div className="p-6 space-y-8">
                  {meal.foods.map((food) => (
                    <div
                      key={food.id}
                      className="bg-gray-50 rounded-lg p-6 space-y-6"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">
                            {food.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {food.type.replace("_", " ")}
                          </p>
                        </div>
                        {food.diabetesFriendly !== undefined && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {food.diabetesFriendly
                              ? "Diabetes-Friendly"
                              : "High GI"}
                          </span>
                        )}
                      </div>

                      {/* Ingredients */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Ingredients
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {food.ingredients.map((ingredient) => (
                            <div
                              key={ingredient.id}
                              className="flex items-center space-x-2 p-2 rounded-md"
                              style={{
                                backgroundColor: `${
                                  COLOR_SCHEMES.ingredient[
                                    ingredient.category as keyof typeof COLOR_SCHEMES.ingredient
                                  ]
                                }20`,
                              }}
                            >
                              <span className="text-sm">
                                {ingredient.name}
                                <span className="text-gray-500 text-xs ml-1">
                                  ({ingredient.amount} {ingredient.unit})
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Instructions
                        </h4>
                        <ol className="space-y-2">
                          {food.instructions.map((instruction, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 flex items-start"
                            >
                              <span className="font-medium mr-2">
                                {index + 1}.
                              </span>
                              {instruction}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Nutritional Information */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Nutritional Values
                        </h4>
                        <div className="grid grid-cols-4 gap-3">
                          {Object.entries(food.nutritionalInfo)
                            .filter(([key]) => {
                              // Filter out optional fields that are undefined
                              const value =
                                food.nutritionalInfo[
                                  key as keyof typeof food.nutritionalInfo
                                ];
                              return (
                                value !== undefined &&
                                ![
                                  "glycemicIndex",
                                  "glycemicLoad",
                                  "sugarContent",
                                ].includes(key)
                              );
                            })
                            .map(([key, value]) => (
                              <div
                                key={key}
                                className="bg-white p-3 rounded-lg text-center"
                              >
                                <div className="text-lg font-semibold text-gray-800">
                                  {value}
                                  {key === "calories" ? " kcal" : "g"}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Optional Nutritional Values */}
                        {(food.nutritionalInfo.glycemicIndex !== undefined ||
                          food.nutritionalInfo.glycemicLoad !== undefined ||
                          food.nutritionalInfo.sugarContent !== undefined) && (
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            {food.nutritionalInfo.glycemicIndex !==
                              undefined && (
                              <div className="bg-white p-3 rounded-lg text-center">
                                <div className="text-lg font-semibold text-gray-800">
                                  {food.nutritionalInfo.glycemicIndex}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Glycemic Index
                                </div>
                              </div>
                            )}
                            {food.nutritionalInfo.glycemicLoad !==
                              undefined && (
                              <div className="bg-white p-3 rounded-lg text-center">
                                <div className="text-lg font-semibold text-gray-800">
                                  {food.nutritionalInfo.glycemicLoad}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Glycemic Load
                                </div>
                              </div>
                            )}
                            {food.nutritionalInfo.sugarContent !==
                              undefined && (
                              <div className="bg-white p-3 rounded-lg text-center">
                                <div className="text-lg font-semibold text-gray-800">
                                  {food.nutritionalInfo.sugarContent}g
                                </div>
                                <div className="text-xs text-gray-500">
                                  Sugars
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Additional Information */}
                      <div className="flex flex-wrap gap-2">
                        <div className="text-sm text-gray-600">
                          Prep: {food.preparationTime}min
                        </div>
                        <div className="text-sm text-gray-600">
                          Cook: {food.cookingTime}min
                        </div>
                        {food.allergens.length > 0 && (
                          <div className="text-sm text-red-600">
                            Contains: {food.allergens.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 bg-white border-t p-4 flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors">
                    Add to Favorites
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    Add to Meal Plan
                  </button>
                </div>
              </motion.div>
            ) : recommendation ? (
              // Recommendation details view
              <motion.div
                key="recommendation-details"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="h-full"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-white z-10 shadow-sm">
                  <div className="flex justify-between items-center p-4 border-b">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Recommended Meal
                      </h2>
                      <p className="text-sm text-gray-500">
                        {recommendation.meal.name}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg
                        className="w-6 h-6 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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

                {/* Recommendation Content */}
                <div className="p-6 space-y-8">
                  {/* Score and Time */}
                  <div className="flex justify-between items-center">
                    <div>
                      {recommendation.meal.diabetesFriendly && (
                        <span className="inline-flex items-center px-2 py-1 mt-2 bg-green-100 text-green-800 text-xs rounded-full">
                          Diabetes-Friendly
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`
                          w-16 h-16 rounded-full flex items-center justify-center
                          font-semibold text-lg border-2
                          ${
                            recommendation.score >= 80
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-yellow-500 text-yellow-700 bg-yellow-50"
                          }
                        `}
                      >
                        {recommendation.score}
                      </div>
                      <span className="text-sm text-gray-500">Match Score</span>
                    </div>
                  </div>

                  {/* Reasons */}
                  {recommendation.reasons &&
                    recommendation.reasons.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          Why This Meal?
                        </h3>
                        <div className="space-y-2">
                          {recommendation.reasons.map((reason, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <svg
                                className="w-5 h-5 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Nutritional Impact */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Nutritional Impact
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(recommendation.nutritionalImpact).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-gray-50 rounded-lg p-3 text-center"
                          >
                            <div className="text-lg font-semibold text-gray-700">
                              {value > 0 ? "+" : ""}
                              {value}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {key}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Health Benefits */}
                  {recommendation.healthBenefits &&
                    recommendation.healthBenefits.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          Health Benefits
                        </h3>
                        <div className="space-y-2">
                          {recommendation.healthBenefits.map(
                            (benefit, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 text-sm"
                              >
                                <svg
                                  className="w-5 h-5 text-blue-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                                <span>{benefit}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </motion.div>
            ) : (
              // Guide View
              <motion.div
                key="guide-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <div className="p-6 space-y-6">
                  {/* Logo and Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Meal Explorer
                    </h2>
                    <p className="text-gray-500 mt-2">
                      Click on any meal to see detailed information
                    </p>
                  </div>

                  {/* Quick Guide */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Getting Started
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mr-2">
                          1
                        </span>
                        Click on any meal card in the calendar
                      </li>
                      <li className="flex items-center">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mr-2">
                          2
                        </span>
                        View detailed nutritional information
                      </li>
                      <li className="flex items-center">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mr-2">
                          3
                        </span>
                        Explore ingredients and preparation steps
                      </li>
                    </ul>
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Keyboard Shortcuts
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Toggle Left Panel</span>
                        <span className="flex space-x-1">
                          <kbd className="px-2 py-1 bg-white rounded shadow text-xs">
                            [
                          </kbd>
                          <kbd className="px-2 py-1 bg-white rounded shadow text-xs">
                            ]
                          </kbd>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Close Meal Details</span>
                        <kbd className="px-2 py-1 bg-white rounded shadow text-xs">
                          Esc
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nutritional Goals Progress */}
      <div className="flex-shrink-0 border-t bg-gradient-to-br from-white to-gray-50 p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Daily Nutrition Goals
            </h3>
            <span className="text-xs text-gray-500">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            {/* Calories */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Calories</span>
                <span className="text-gray-500">
                  {currentNutritionalValues.calories} /{" "}
                  {nutritionalGoals.dailyCalories} kcal
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.calories /
                        nutritionalGoals.dailyCalories) *
                        100,
                      100
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Carbohydrates */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Carbohydrates</span>
                <span className="text-gray-500">
                  {currentNutritionalValues.carbs}
                  {nutritionalGoals.carbohydrates.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.carbs /
                        nutritionalGoals.carbohydrates.max) *
                        100,
                      100
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Protein */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Protein</span>
                <span className="text-gray-500">
                  {currentNutritionalValues.protein}
                  {nutritionalGoals.protein.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.protein /
                        nutritionalGoals.protein.max) *
                        100,
                      100
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Fiber */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Fiber</span>
                <span className="text-gray-500">
                  {currentNutritionalValues.fiber} /{" "}
                  {nutritionalGoals.fiber.daily}
                  {nutritionalGoals.fiber.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.fiber /
                        nutritionalGoals.fiber.daily) *
                        100,
                      100
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              {
                label: "Calories",
                value: `${Math.round(
                  (currentNutritionalValues.calories /
                    nutritionalGoals.dailyCalories) *
                    100
                )}%`,
                color: "text-green-500",
              },
              {
                label: "Carbs",
                value: `${Math.round(
                  (currentNutritionalValues.carbs /
                    nutritionalGoals.carbohydrates.max) *
                    100
                )}%`,
                color: "text-blue-500",
              },
              {
                label: "Protein",
                value: `${Math.round(
                  (currentNutritionalValues.protein /
                    nutritionalGoals.protein.max) *
                    100
                )}%`,
                color: "text-purple-500",
              },
              {
                label: "Fiber",
                value: `${Math.round(
                  (currentNutritionalValues.fiber /
                    nutritionalGoals.fiber.daily) *
                    100
                )}%`,
                color: "text-orange-500",
              },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-sm font-semibold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

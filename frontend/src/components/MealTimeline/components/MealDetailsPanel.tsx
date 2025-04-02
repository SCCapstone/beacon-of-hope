import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Meal, Food, Ingredient, VisualizationLevel } from "../types";
import { COLOR_SCHEMES } from "../constants";
import { MealRecommendation } from "../types";

interface MealDetailsPanelProps {
  meal: Meal | null;
  food: Food | null;
  ingredient: Ingredient | null;
  recommendation: MealRecommendation | null;
  currentLevel: VisualizationLevel["type"];
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

// Helper to render Nutritional Info Grid (reusable)
const NutritionalInfoGrid: React.FC<{ nutritionalInfo: any }> = ({
  nutritionalInfo,
}) => {
  if (!nutritionalInfo) return null;

  const mainNutrients = Object.entries(nutritionalInfo).filter(
    ([key, value]) =>
      value !== undefined &&
      !["glycemicIndex", "glycemicLoad", "sugarContent"].includes(key)
  );
  const optionalNutrients = Object.entries(nutritionalInfo).filter(
    ([key, value]) =>
      value !== undefined &&
      ["glycemicIndex", "glycemicLoad", "sugarContent"].includes(key)
  );

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Nutritional Values
      </h4>
      {/* Main Nutrients */}
      <div className="grid grid-cols-4 gap-3">
        {mainNutrients.map(([key, value]) => (
          <div key={key} className="bg-white p-3 rounded-lg text-center border">
            <div className="text-lg font-semibold text-gray-800">
              {typeof value === "number" ? value.toFixed(0) : String(value)}
              {key === "calories" ? " kcal" : "g"}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
          </div>
        ))}
      </div>

      {/* Optional Nutrients */}
      {optionalNutrients.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {optionalNutrients.map(([key, value]) => (
            <div
              key={key}
              className="bg-white p-3 rounded-lg text-center border"
            >
              <div className="text-lg font-semibold text-gray-800">
                {typeof value === "number"
                  ? value.toFixed(key === "glycemicIndex" ? 1 : 0)
                  : String(value)}
                {key === "sugarContent" ? "g" : ""}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {key === "glycemicIndex"
                  ? "Glycemic Index"
                  : key === "glycemicLoad"
                  ? "Glycemic Load"
                  : "Sugars"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MealDetailsPanel: React.FC<MealDetailsPanelProps> = ({
  meal,
  food, // Use selected food
  ingredient, // Use selected ingredient
  recommendation,
  currentLevel, // Use current level
  onClose,
  nutritionalGoals,
  currentNutritionalValues,
  // baseNutritionalValues,
  selectedDate,
}) => {
  // Determine what to display based on selection priority: Rec > Meal > Food > Ingredient
  const displayItem = recommendation
    ? "recommendation"
    : meal
    ? "meal"
    : food
    ? "food"
    : ingredient
    ? "ingredient"
    : "guide";
  // const itemData = recommendation || meal || food || ingredient;

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="pb-24">
          {" "}
          {/* Padding for bottom nutritional goals */}
          <AnimatePresence mode="wait">
            {/* --- Recommendation Details --- */}
            {displayItem === "recommendation" && recommendation && (
              <motion.div
                key="recommendation-details"
                /* ... animation props ... */ className="h-full"
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
                {/* Recommendation Content (Keep existing) */}
                <div className="p-6 space-y-8">
                  {/* ... score, reasons, nutritional impact, benefits ... */}
                </div>
              </motion.div>
            )}

            {/* --- Meal Details --- */}
            {displayItem === "meal" && meal && (
              <motion.div
                key="meal-details"
                /* ... animation props ... */ className="h-full"
              >
                {/* Header (Keep existing) */}
                <div className="flex-shrink-0 bg-white z-10 shadow-sm">
                  {/* ... meal header ... */}
                </div>
                {/* Foods Section (Keep existing) */}
                <div className="p-6 space-y-8">
                  {meal.foods.map(
                    (
                      f // Use different variable name
                    ) => (
                      <div
                        key={f.id}
                        className="bg-gray-50 rounded-lg p-6 space-y-6"
                      >
                        {/* ... food details within meal (keep existing) ... */}
                        <NutritionalInfoGrid
                          nutritionalInfo={f.nutritionalInfo}
                        />
                        {/* ... ingredients, instructions, etc. ... */}
                      </div>
                    )
                  )}
                </div>
                {/* Footer Actions (Keep existing) */}
                <div className="flex-shrink-0 bg-white border-t p-4 flex justify-end space-x-3">
                  {/* ... buttons ... */}
                </div>
              </motion.div>
            )}

            {/* --- Food Details --- */}
            {displayItem === "food" && food && (
              <motion.div
                key="food-details"
                /* ... animation props ... */ className="h-full"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-white z-10 shadow-sm">
                  <div className="flex justify-between items-center p-4 border-b">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {food.name}
                      </h2>
                      <p className="text-sm text-gray-500 capitalize">
                        {food.type.replace("_", " ")}
                      </p>
                    </div>
                    <button onClick={onClose} /* ... close button ... */>
                      {" "}
                      {/* ... svg ... */}{" "}
                    </button>
                  </div>
                </div>
                {/* Food Content */}
                <div className="p-6 space-y-6">
                  {/* Nutritional Info */}
                  <NutritionalInfoGrid nutritionalInfo={food.nutritionalInfo} />

                  {/* Ingredients */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Ingredients
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {food.ingredients.map((ing) => (
                        <div
                          key={ing.id}
                          className="flex items-center space-x-2 p-2 rounded-md"
                          style={{
                            backgroundColor: `${
                              COLOR_SCHEMES.ingredient[
                                ing.category as keyof typeof COLOR_SCHEMES.ingredient
                              ]
                            }20`,
                          }}
                        >
                          <span className="text-sm">
                            {ing.name}
                            <span className="text-gray-500 text-xs ml-1">
                              ({ing.amount} {ing.unit})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  {food.instructions && food.instructions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Instructions
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        {food.instructions.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Other Info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span>Prep: {food.preparationTime}min</span>
                    <span>Cook: {food.cookingTime}min</span>
                    {food.diabetesFriendly !== undefined && (
                      <span
                        className={`font-medium ${
                          food.diabetesFriendly
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {food.diabetesFriendly
                          ? "Diabetes-Friendly"
                          : "High GI/Check"}
                      </span>
                    )}
                    {food.allergens.length > 0 && (
                      <span className="text-red-600">
                        Contains: {food.allergens.join(", ")}
                      </span>
                    )}
                    {food.culturalOrigin && food.culturalOrigin.length > 0 && (
                      <span>Origin: {food.culturalOrigin.join(", ")}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- Ingredient Details --- */}
            {displayItem === "ingredient" && ingredient && (
              <motion.div
                key="ingredient-details"
                /* ... animation props ... */ className="h-full"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-white z-10 shadow-sm">
                  <div className="flex justify-between items-center p-4 border-b">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {ingredient.name}
                      </h2>
                      <p className="text-sm text-gray-500 capitalize">
                        {ingredient.category}
                      </p>
                    </div>
                    <button onClick={onClose} /* ... close button ... */>
                      {" "}
                      {/* ... svg ... */}{" "}
                    </button>
                  </div>
                </div>
                {/* Ingredient Content */}
                <div className="p-6 space-y-6">
                  {/* Amount */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Amount Used (Typical):{" "}
                    </span>
                    <span className="text-lg font-medium text-gray-800">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>

                  {/* Nutritional Info */}
                  <NutritionalInfoGrid
                    nutritionalInfo={ingredient.nutritionalInfo}
                  />

                  {/* Other Info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {ingredient.allergens &&
                      ingredient.allergens.length > 0 && (
                        <span className="text-red-600">
                          Potential Allergen: {ingredient.allergens.join(", ")}
                        </span>
                      )}
                    {ingredient.culturalOrigin &&
                      ingredient.culturalOrigin.length > 0 && (
                        <span>
                          Cultural Origin:{" "}
                          {ingredient.culturalOrigin.join(", ")}
                        </span>
                      )}
                    {ingredient.substitutes &&
                      ingredient.substitutes.length > 0 && (
                        <span>
                          Substitutes: {ingredient.substitutes.join(", ")}
                        </span>
                      )}
                    {ingredient.diabetesFriendly !== undefined && (
                      <span
                        className={`font-medium ${
                          ingredient.diabetesFriendly
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {ingredient.diabetesFriendly
                          ? "Generally Diabetes-Friendly"
                          : "Use with Caution"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- Guide View (Default) --- */}
            {displayItem === "guide" && (
              <motion.div
                key="guide-view"
                /* ... animation props ... */ className="h-full"
              >
                {/* ... Existing guide content ... */}
                <div className="p-6 space-y-6">
                  {/* Logo and Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Meal Explorer
                    </h2>
                    <p className="text-gray-500 mt-2">
                      Select an item from the {currentLevel} view or a
                      recommendation.
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

import React from "react";
import { motion } from "framer-motion";
import { MealRecommendation } from "../types";
import { FoodTypeIcon } from "./FoodTypeIcon";

interface RecommendedMealCardProps {
  recommendation: MealRecommendation;
  onClick: () => void;
  isSelected: boolean;
  className?: string;
}

export const RecommendedMealCard: React.FC<RecommendedMealCardProps> = ({
  recommendation,
  onClick,
  isSelected,
  className = "",
}) => {
  const { meal, score, nutritionalImpact, healthBenefits } = recommendation;

  // Helper function to check if meal is diabetes friendly
  const isDiabetesFriendly = (meal: MealRecommendation["meal"]): boolean => {
    // If explicitly marked
    if (meal.diabetesFriendly !== undefined) return meal.diabetesFriendly;

    // Check foods
    const allFoodsDiabetesFriendly = meal.foods.every(
      (food) => food.diabetesFriendly !== undefined && food.diabetesFriendly
    );
    if (allFoodsDiabetesFriendly) return true;

    // Check glycemic index if available
    const hasLowGI = meal.foods.every((food) => {
      const gi = food.nutritionalInfo.glycemicIndex;
      return gi !== undefined && gi < 55; // 55 is generally considered low GI
    });

    return hasLowGI;
  };

  // Format nutritional impact values
  const formatImpact = (value: number): string => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${className} relative p-4 rounded-lg cursor-pointer
        transform transition-all duration-300
        ${isSelected ? "ring-2 ring-green-500" : ""}
        ${"bg-white/75"}
        backdrop-blur-sm flex flex-col`}
      style={{
        boxShadow: isSelected
          ? "0 0 15px rgba(16, 185, 129, 0.2)"
          : "0 2px 4px rgba(0,0,0,0.05)",
        minHeight: "180px",
      }}
    >
      {/* Simulation Indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 
            bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium
            shadow-sm whitespace-nowrap z-10"
        >
          Simulating nutritional impact
        </motion.div>
      )}

      {/* Recommendation Badge */}
      <div className="absolute -top-3 left-4 z-10">
        <span
          className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 
          text-white text-xs font-medium rounded-full shadow-sm"
        >
          Recommended
        </span>
      </div>

      {/* Score Badge */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center
            text-xs font-semibold
            ${
              score >= 80
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {score}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-full flex flex-col justify-between">
        {/* Header Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-800 truncate pr-10">
            {meal.name}
          </h3>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-xs text-gray-500">{meal.time}</span>
            {isDiabetesFriendly(meal) && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                DF
              </span>
            )}
          </div>
        </div>

        {/* Macronutrient bars - visual representation */}
        <div className="mt-3 space-y-2">
          {/* Calories */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Calories</span>
              <span className="text-gray-700 font-medium flex items-center">
                {meal.nutritionalInfo.calories}
                {isSelected && nutritionalImpact && (
                  <span
                    className={`ml-1 ${
                      nutritionalImpact.calories > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ({formatImpact(nutritionalImpact.calories)})
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full"
                style={{
                  width: `${Math.min((meal.nutritionalInfo.calories / 500) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Carbs bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Carbs</span>
              <span className="text-gray-700 font-medium flex items-center">
                {meal.nutritionalInfo.carbs}g
                {isSelected && nutritionalImpact && (
                  <span
                    className={`ml-1 ${
                      nutritionalImpact.carbs > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ({formatImpact(nutritionalImpact.carbs)}g)
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.carbs, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Protein bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Protein</span>
              <span className="text-gray-700 font-medium flex items-center">
                {meal.nutritionalInfo.protein}g
                {isSelected && nutritionalImpact && (
                  <span
                    className={`ml-1 ${
                      nutritionalImpact.protein > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ({formatImpact(nutritionalImpact.protein)}g)
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.protein * 2, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Food items in the meal */}
        {meal.foods.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex-grow">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Includes:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {meal.foods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded text-xs"
                >
                  <div className="flex items-center">
                    <FoodTypeIcon
                      type={food.type}
                      className="w-4 h-4 mr-1.5 text-gray-600"
                    />
                    <span className="text-gray-800">{food.name}</span>
                  </div>
                  <span className="text-gray-500 capitalize">
                    {food.type.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health indicators */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2">
            {meal.nutritionalInfo.glycemicIndex !== undefined && (
              <div className="bg-blue-50 rounded p-1.5 text-center">
                <div className="text-xs text-gray-500">GI</div>
                <div className="text-sm font-medium text-blue-700">
                  {meal.nutritionalInfo.glycemicIndex.toFixed(1)}
                </div>
              </div>
            )}

            {meal.nutritionalInfo.glycemicLoad !== undefined && (
              <div className="bg-green-50 rounded p-1.5 text-center">
                <div className="text-xs text-gray-500">GL</div>
                <div className="text-sm font-medium text-green-700">
                  {meal.nutritionalInfo.glycemicLoad}
                </div>
              </div>
            )}

            {meal.nutritionalInfo.fiber > 0 && (
              <div className="bg-purple-50 rounded p-1.5 text-center">
                <div className="text-xs text-gray-500">Fiber</div>
                <div className="text-sm font-medium text-purple-700">
                  {meal.nutritionalInfo.fiber}g
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health Benefits */}
        {healthBenefits && healthBenefits.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="bg-green-50 rounded-md p-2 text-xs text-green-700">
              <span className="font-medium">Benefit:</span> {healthBenefits[0]}
            </div>
          </div>
        )}
      </div>

      {/* Simulation Effect */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 0 rgba(59, 130, 246, 0)",
              "0 0 20px rgba(59, 130, 246, 0.3)",
              "0 0 0 rgba(59, 130, 246, 0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      )}
    </motion.div>
  );
};

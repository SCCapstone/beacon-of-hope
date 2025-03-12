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
  const { meal, score, nutritionalImpact } = recommendation;

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
        minHeight: "120px",
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
      {
        <div className="absolute -top-3 left-4 z-10">
          <span
            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 
            text-white text-xs font-medium rounded-full shadow-sm"
          >
            Recommended
          </span>
        </div>
      }

      {/* Score Badge */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center
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
            {meal.nutritionalInfo.glycemicIndex !== undefined && (
                <span className="text-xs text-gray-500">
                GI: {meal.nutritionalInfo.glycemicIndex.toFixed(2)}
                </span>
            )}
          </div>
        </div>

        {/* Food items in the meal with icons*/}
        {meal.foods.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100 flex-grow">
            <h4 className="text-xs font-medium text-gray-700 mb-1.5">Includes:</h4>
            <div className="space-y-1">
              {meal.foods.map((food) => (
                <div 
                  key={food.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center">
                    <FoodTypeIcon 
                      type={food.type} 
                      className="w-4 h-4 mr-1.5 text-gray-600" 
                    />
                    <span className="text-gray-800">{food.name}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{food.type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Section */}
        <div className="relative mt-3 pt-2 border-t border-gray-100">
          {/* Nutritional Values */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {meal.nutritionalInfo.calories} cal
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
            <span className="text-gray-600">
              {meal.nutritionalInfo.carbs}g carbs
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

          {/* Health indicators - new section */}
          {meal.nutritionalInfo.glycemicIndex !== undefined && (
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-gray-600">
                GI: {meal.nutritionalInfo.glycemicIndex.toFixed(1)}
              </span>
              <span className="text-gray-600">
                GL: {meal.nutritionalInfo.glycemicLoad || 0}
              </span>
              {meal.nutritionalInfo.fiber > 0 && (
                <span className="text-gray-600">
                  Fiber: {meal.nutritionalInfo.fiber}g
                </span>
              )}
            </div>
          )}

          {/* Optional Health Benefits Preview */}
          {recommendation.healthBenefits &&
            recommendation.healthBenefits.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 truncate">
                {recommendation.healthBenefits[0]}
              </div>
            )}
        </div>
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

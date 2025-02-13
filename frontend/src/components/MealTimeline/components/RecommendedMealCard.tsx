import React from "react";
import { motion } from "framer-motion";
import { MealRecommendation } from "../types";
import { COLOR_SCHEMES } from "../constants";

interface RecommendedMealCardProps {
  recommendation: MealRecommendation;
  onClick: () => void;
  isSelected: boolean;
  isEmptyDay?: boolean;
  className?: string;
}

export const RecommendedMealCard: React.FC<RecommendedMealCardProps> = ({
  recommendation,
  onClick,
  isSelected,
  isEmptyDay = false,
  className = "",
}) => {
  const { meal, score, nutritionalImpact } = recommendation;

  return (
    <motion.div
      whileHover={{ scale: isEmptyDay ? 1.02 : 1.01, y: -1 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${className} relative p-3 rounded-lg cursor-pointer
        transform transition-all duration-300
        ${isSelected ? "ring-2 ring-green-500" : ""}
        ${isEmptyDay ? "bg-white/90" : "bg-white/75"}
        backdrop-blur-sm`}
      style={{
        boxShadow: isSelected
          ? "0 0 15px rgba(16, 185, 129, 0.2)"
          : "0 2px 4px rgba(0,0,0,0.05)",
        height: "80px",
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
      {isEmptyDay && (
        <div className="absolute -top-3 left-4 z-10">
          <span
            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 
            text-white text-xs font-medium rounded-full shadow-sm"
          >
            Recommended
          </span>
        </div>
      )}

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
            {meal.diabetesFriendly && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                DF
              </span>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="relative">
          {/* Nutritional Values */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {meal.nutritionalInfo.calories} cal
              {isSelected && (
                <span className="text-green-600 ml-1">
                  ({nutritionalImpact.calories > 0 ? "+" : ""}
                  {nutritionalImpact.calories})
                </span>
              )}
            </span>
            <span className="text-gray-600">
              {meal.nutritionalInfo.carbs}g carbs
              {isSelected && (
                <span className="text-green-600 ml-1">
                  ({nutritionalImpact.carbs > 0 ? "+" : ""}
                  {nutritionalImpact.carbs}g)
                </span>
              )}
            </span>
          </div>
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

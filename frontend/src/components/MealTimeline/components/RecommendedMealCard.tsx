import React from "react";
import { motion } from "framer-motion";
import { MealRecommendation } from "../types";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { FoodTypeIcon } from "./FoodTypeIcon";
import { formatScore } from "../utils";

interface RecommendedMealCardProps {
  recommendation: MealRecommendation;
  onClick: () => void;
  onAccept: () => void;
  onReject: () => void;
  isSelected: boolean;
  className?: string;
}

// const isMealDiabetesFriendly = (meal: MealRecommendation["meal"]): boolean => {
//   // Access diabetesFriendly from the nested meal object
//   return meal.diabetesFriendly ?? false;
// };

export const RecommendedMealCard: React.FC<RecommendedMealCardProps> = ({
  recommendation,
  onClick,
  onAccept,
  onReject,
  isSelected,
  className = "",
}) => {
  // Destructure from recommendation and its nested meal
  const { meal, nutritionalImpact, healthBenefits } = recommendation;
  // Get scores from the MEAL object within the recommendation
  const {
    nutritionalInfo,
    foods = [],
    varietyScore,
    coverageScore,
    constraintScore,
  } = meal;

  // Defensive check for nutritionalInfo
  const safeNutritionalInfo = nutritionalInfo || { calories: 0, protein: 0, carbs: 0, fiber: 0 };

  // const diabetesFriendly = isMealDiabetesFriendly(meal);
  const foodTypes = Array.from(new Set(foods.map((food) => food.type)));

  const totalMacros =
    safeNutritionalInfo.carbs + safeNutritionalInfo.protein + safeNutritionalInfo.fiber;
  const carbPercent =
    totalMacros > 0 ? (safeNutritionalInfo.carbs / totalMacros) * 100 : 0;
  const proteinPercent =
    totalMacros > 0 ? (safeNutritionalInfo.protein / totalMacros) * 100 : 0;
  const fiberPercent =
    totalMacros > 0 ? (safeNutritionalInfo.fiber / totalMacros) * 100 : 0;

  const formatImpact = (value: number | undefined): JSX.Element | null => {
    if (value === undefined || value === 0 || !isSelected) return null;
    const prefix = value > 0 ? "+" : "";
    const color =
      value > 0
        ? "text-green-600"
        : value < 0
        ? "text-red-600"
        : "text-gray-500";
    return (
      <span className={`${color} text-[10px] ml-1`}>
        ({prefix}
        {value})
      </span>
    );
  };

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept();
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReject();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.0005 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${className} recommendation-card relative p-2 rounded-lg cursor-pointer
        transform transition-all duration-300
        ${
          isSelected
            ? "ring-2 ring-green-500"
            : "border border-dashed border-green-300"
        }
        bg-green-50/80 backdrop-blur-sm flex flex-col min-h-[100px]`}
      style={{
        boxShadow: isSelected
          ? "0 0 10px rgba(16, 185, 129, 0.15)"
          : "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {/* Simulation Indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 transform -translate-x-1/2
            bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium
            shadow-sm whitespace-nowrap z-10"
        >
          Simulating Impact
        </motion.div>
      )}

      {/* Header Section: Name, Calories */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-800 truncate">
          {meal.name}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-full whitespace-nowrap">
            {nutritionalInfo.calories} cal
            {formatImpact(nutritionalImpact?.calories)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <motion.button
        whileHover={{
          scale: 1.05,
          backgroundColor: "rgba(34, 197, 94, 0.9)",
        }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAcceptClick}
        className="absolute -top-2 -right-2 p-0.5 rounded-full text-white bg-green-500 shadow-md z-20 hover:bg-green-600 transition-colors"
        title="Accept Recommendation"
      >
        <CheckIcon className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{
          scale: 1.05,
          backgroundColor: "rgba(239, 68, 68, 0.9)",
        }}
        whileTap={{ scale: 0.9 }}
        onClick={handleRejectClick}
        className="absolute -top-2 -left-2 p-0.5 rounded-full text-white bg-red-500 shadow-md z-20 hover:bg-red-600 transition-colors"
        title="Reject Recommendation"
      >
        <XMarkIcon className="w-4 h-4" />
      </motion.button>

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Macro Labels */}
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-blue-900">
            Carbs {Math.round(carbPercent)}%
          </span>
          <span className="text-purple-900">
            Protein {Math.round(proteinPercent)}%
          </span>
          <span className="text-orange-900">
            Fiber {Math.round(fiberPercent)}%
          </span>
        </div>

        {/* Macro Visualization with 3 segments */}
        <div className="flex h-2 rounded-full overflow-hidden mb-3">
          <div className="bg-blue-400" style={{ width: `${carbPercent}%` }} title={`Carbs: ${safeNutritionalInfo.carbs}g`} />
          <div
            className="bg-purple-400"
            style={{ width: `${proteinPercent}%` }}
            title={`Protein: ${safeNutritionalInfo.protein}g`}
          />
          <div
            className="bg-orange-400"
            style={{ width: `${fiberPercent}%` }}
            title={`Fiber: ${safeNutritionalInfo.fiber}g`}
          />
        </div>

        {/* Food Type Icons */}
        {foodTypes.length > 0 && (
          <div className="flex items-center mt-1 mb-2">
            {foodTypes.map((type, index) => (
              <div key={`${type}-${index}`} className="mr-1" title={type}>
                <FoodTypeIcon type={type} className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>
        )}

        {/* Footer Indicators (Scores) */}
        <div className="pt-2 mt-auto flex justify-around border-t border-gray-100 text-xs text-gray-600">
          <span title="Variety Score">V: {formatScore(varietyScore)}</span>
          <span title="Coverage Score">C: {formatScore(coverageScore)}</span>
          <span title="Nutrition Score">N: {formatScore(constraintScore)}</span>
        </div>

        {/* Health Benefits (Show first one if available) */}
        {(healthBenefits ?? []).length > 0 && (
          <div className="mt-2 pt-2 border-t border-green-100">
            <div className="bg-green-100 rounded-md px-2 py-1 text-xs text-green-800 text-center truncate">
              <span className="font-medium">Benefit:</span>{" "}
              {healthBenefits?.[0]}
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
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </motion.div>
  );
};

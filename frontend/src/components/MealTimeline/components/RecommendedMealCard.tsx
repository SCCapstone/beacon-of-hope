import React from "react";
import { motion } from "framer-motion";
import { MealRecommendation } from "../types";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { FoodTypeIcon } from "./FoodTypeIcon";
import { formatScore } from "../utils";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

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
  const safeNutritionalInfo = nutritionalInfo || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fiber: 0,
  };

  // const diabetesFriendly = isMealDiabetesFriendly(meal);
  const foodTypes = Array.from(new Set(foods.map((food) => food.type)));

  const totalMacros =
    safeNutritionalInfo.carbs +
    safeNutritionalInfo.protein +
    safeNutritionalInfo.fiber;
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
        ? "text-[#5CB85C]"
        : value < 0
        ? "text-[#D9534F]"
        : "text-gray-500"; // Accent Green/Red
    return (
      <span className={`${color} text-[10px] ml-1`}>
        ({prefix}
        {value.toFixed(0)})
      </span>
    ); // Integer impact
  };

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept();
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReject();
  };

  const scoreDescriptions = {
    variety: "Measures the variation present in the recommended items",
    coverage:
      "Measures how well the recommended items fit the requested roles (Main Course, Side, etc.)",
    nutrition:
      "Measures how well the recommended items fit the requested user preferences (dairy, meat, and nuts)",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }} // Subtle hover effect
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${className} recommendation-card relative p-3 rounded-lg cursor-pointer
        transform transition-all duration-200
        ${
          isSelected
            ? "ring-2 ring-[#5CB85C]"
            : "border border-dashed border-[#5CB85C]/50"
        } // Accent Green ring/border
        bg-[#90EE90]/15 backdrop-blur-sm flex flex-col min-h-[120px]`} // Lighter accent green bg, increased padding/min-height
      style={{
        boxShadow: isSelected
          ? "0 0 10px rgba(92, 184, 92, 0.2)"
          : "0 1px 2px rgba(0,0,0,0.03)",
      }} // Accent Green shadow
    >
      {/* Simulation Indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2.5 left-8 transform -translate-x-1/2 bg-pink-900/80 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm whitespace-nowrap z-10" // Primary color indicator
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
        whileHover={{ scale: 1.05, backgroundColor: "#4CAE4C" }} // Darker Accent Green
        whileTap={{ scale: 0.9 }}
        onClick={handleAcceptClick}
        className="absolute -top-2 -right-2 p-0.5 rounded-full text-white bg-[#5CB85C] shadow-md z-20 transition-colors" // Accent Green
        data-tooltip-id="global-tooltip"
        data-tooltip-content="Accept Recommendation"
      >
        <CheckIcon className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: "#C9302C" }} // Darker Accent Red
        whileTap={{ scale: 0.9 }}
        onClick={handleRejectClick}
        className="absolute -top-2 -left-2 p-0.5 rounded-full text-white bg-[#D9534F] shadow-md z-20 transition-colors" // Accent Red
        data-tooltip-id="global-tooltip" // <-- Add tooltip attributes
        data-tooltip-content="Reject Recommendation"
      >
        <XMarkIcon className="w-4 h-4" />
      </motion.button>

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Macro Labels */}
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-[#1A8C8A]">
            Carbs {Math.round(carbPercent)}%
          </span>{" "}
          {/* Darker Teal */}
          <span className="text-[#6B4226]">
            Protein {Math.round(proteinPercent)}%
          </span>{" "}
          {/* Darker Maroon */}
          <span className="text-[#B8860B]">
            Fiber {Math.round(fiberPercent)}%
          </span>
          {/* Darker Gold */}
        </div>

        {/* Macro Visualization */}
        <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
          {/* Thicker bar */}
          <div
            className="bg-[#20B2AA]"
            style={{ width: `${carbPercent}%` }}
            data-tooltip-id="global-tooltip"
            data-tooltip-content={`Carbs: ${safeNutritionalInfo.carbs.toFixed(
              1
            )}g`}
          />
          {/* Nutrient Teal */}
          <div
            className="bg-[#8B4513]"
            style={{ width: `${proteinPercent}%` }}
            data-tooltip-id="global-tooltip"
            data-tooltip-content={`Protein: ${safeNutritionalInfo.protein.toFixed(
              1
            )}g`}
          />
          {/* Nutrient Maroon */}
          <div
            className="bg-[#DAA520]"
            style={{ width: `${fiberPercent}%` }}
            data-tooltip-id="global-tooltip"
            data-tooltip-content={`Fiber: ${safeNutritionalInfo.fiber.toFixed(
              1
            )}g`}
          />
          {/* Nutrient Gold */}
        </div>

        {/* Food Type Icons */}
        {foodTypes.length > 0 && (
          <div className="flex items-center mt-1 mb-2 space-x-1">
            {/* Added space */}
            {foodTypes.map((type, index) => (
              <div
                key={`${type}-${index}`}
                data-tooltip-id="global-tooltip"
                data-tooltip-content={type.replace("_", " ")}
              >
                <FoodTypeIcon type={type} className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>
        )}

        {/* Footer Indicators (Scores) */}
        <div className="pt-2 mt-auto flex justify-around border-t border-green-100 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span className="text-[#20B2AA]">
              V: {formatScore(varietyScore)}
            </span>
            <InformationCircleIcon
              className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={scoreDescriptions.variety}
            />
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-[#8B4513]">
              C: {formatScore(coverageScore)}
            </span>
            <InformationCircleIcon
              className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={scoreDescriptions.coverage}
            />
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-[#DAA520]">
              N: {formatScore(constraintScore)}
            </span>
            <InformationCircleIcon
              className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={scoreDescriptions.nutrition}
            />
          </div>
        </div>

        {/* Health Benefits */}
        {(healthBenefits ?? []).length > 0 && (
          <div className="mt-2 pt-2 border-t border-green-100">
            <div className="bg-[#5CB85C]/15 rounded-md px-2 py-1 text-xs text-[#3C763D] text-center truncate">
              {" "}
              {/* Accent Green light */}
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
              "0 0 0 rgba(92, 184, 92, 0)",
              "0 0 15px rgba(92, 184, 92, 0.4)",
              "0 0 0 rgba(92, 184, 92, 0)",
            ],
          }} // Accent Green pulse
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </motion.div>
  );
};

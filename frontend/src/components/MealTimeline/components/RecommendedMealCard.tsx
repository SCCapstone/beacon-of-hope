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

// Helper function
const isMealDiabetesFriendly = (meal: MealRecommendation["meal"]): boolean => {
  if (meal.diabetesFriendly !== undefined) return meal.diabetesFriendly;
  const allFoodsFriendly = meal.foods.every(
    (food) => food.diabetesFriendly === true
  );
  if (allFoodsFriendly) return true;
  // Add more sophisticated checks if needed (e.g., based on overall nutrition)
  return false; // Default to false if unsure
};

export const RecommendedMealCard: React.FC<RecommendedMealCardProps> = ({
  recommendation,
  onClick,
  isSelected,
  className = "",
}) => {
  const { meal, score, nutritionalImpact, healthBenefits } = recommendation;
  const diabetesFriendly = isMealDiabetesFriendly(meal);

  const formatImpact = (value: number | undefined): string => {
    if (value === undefined) return "";
    const prefix = value > 0 ? "+" : "";
    const color =
      value > 0
        ? "text-green-600"
        : value < 0
        ? "text-red-600"
        : "text-gray-500";
    return `<span class="${color}">(${prefix}${value})</span>`; // Use span for color
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${className} recommendation-card relative p-4 rounded-lg cursor-pointer
        transform transition-all duration-300
        ${
          isSelected
            ? "ring-2 ring-green-500"
            : "border border-dashed border-green-300"
        } // Dashed border for rec
        bg-green-50/50 // Slightly green background
        backdrop-blur-sm flex flex-col h-full`}
      style={{
        boxShadow: isSelected
          ? "0 0 15px rgba(16, 185, 129, 0.2)"
          : "0 1px 2px rgba(0,0,0,0.03)",
        minHeight: "200px", // TODO: Match MealCard min-height if desired
      }}
    >
      {/* Simulation Indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 transform -translate-x-1/2
            bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium
            shadow-sm whitespace-nowrap z-10"
        >
          Simulating Impact
        </motion.div>
      )}

      {/* Recommendation Badge & Score */}
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
        <span
          className="px-2 py-0.5 bg-green-500
          text-white text-xs font-medium rounded-full shadow-sm"
        >
          Rec
        </span>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center
            text-xs font-semibold border
            ${
              score >= 80
                ? "bg-green-100 text-green-700 border-green-200"
                : score >= 60
                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                : "bg-orange-100 text-orange-700 border-orange-200"
            }`}
          title={`Match Score: ${score}`}
        >
          {score}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-3">
          <div>
            {/* Added padding right */}
            <h3 className="text-sm font-medium text-gray-800 truncate pr-16">
              {meal.name}
            </h3>
            <div className="flex items-center mt-1 space-x-2">
              {meal.name}
              {diabetesFriendly && (
                <span
                  className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                  title="Diabetes Friendly"
                >
                  DF
                </span>
              )}
            </div>
          </div>
          <div className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
            {meal.nutritionalInfo.calories} cal
            {isSelected && nutritionalImpact && (
              <span
                dangerouslySetInnerHTML={{
                  __html: formatImpact(nutritionalImpact.calories),
                }}
              />
            )}
          </div>
        </div>

        {/* Macronutrient bars - visual representation */}
        <div className="space-y-2">
          {/* Carbs bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Carbs</span>
              <span
                className="text-gray-700 font-medium"
                dangerouslySetInnerHTML={{
                  __html: `${meal.nutritionalInfo.carbs}g${
                    isSelected
                      ? formatImpact(nutritionalImpact?.carbs) + "g"
                      : ""
                  }`,
                }}
              />
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.carbs, 100)}%`,
                }}
              />
            </div>
          </div>
          {/* Protein bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Protein</span>
              <span
                className="text-gray-700 font-medium"
                dangerouslySetInnerHTML={{
                  __html: `${meal.nutritionalInfo.protein}g${
                    isSelected
                      ? formatImpact(nutritionalImpact?.protein) + "g"
                      : ""
                  }`,
                }}
              />
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.protein * 2, 100)}%`,
                }}
              />
            </div>
          </div>
          {/* Fat bar (no impact shown in example) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Fat</span>
              <span className="text-gray-700 font-medium">
                {meal.nutritionalInfo.fat}g
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.fat * 2, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Food items in the meal */}
        {meal.foods.length > 0 && (
          <div className="mt-3 pt-3 border-t border-green-100 flex-grow">
            {" "}
            {/* Use green border */}
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Includes:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {meal.foods.slice(0, 2).map(
                (
                  food // Show only first 2-3 items for brevity
                ) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between bg-white px-2 py-1.5 rounded text-xs border border-gray-100"
                  >
                    <div className="flex items-center">
                      <FoodTypeIcon
                        type={food.type}
                        className="w-4 h-4 mr-1.5 text-gray-600"
                      />
                      <span className="text-gray-800 truncate pr-1">
                        {food.name}
                      </span>
                    </div>
                    <span className="text-gray-500 capitalize flex-shrink-0">
                      {food.type.replace("_", " ")}
                    </span>
                  </div>
                )
              )}
              {meal.foods.length > 2 && (
                <div className="text-xs text-gray-500 text-center mt-1">
                  + {meal.foods.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health indicators */}
        <div className="mt-3 pt-3 border-t border-green-100">
          <div className="grid grid-cols-3 gap-2">
            {/* Simplified indicators for rec card */}
            <div className="bg-blue-50 rounded p-1.5 text-center">
              <div className="text-xs text-gray-500">GI</div>
              <div className="text-sm font-medium text-blue-700">
                {meal.nutritionalInfo.glycemicIndex?.toFixed(1) ?? "N/A"}
              </div>
            </div>
            <div className="bg-green-50 rounded p-1.5 text-center">
              <div className="text-xs text-gray-500">Fiber</div>
              <span
                className="text-sm font-medium text-green-700"
                dangerouslySetInnerHTML={{
                  __html: `${meal.nutritionalInfo.fiber}g${
                    isSelected
                      ? formatImpact(nutritionalImpact?.fiber) + "g"
                      : ""
                  }`,
                }}
              />
            </div>
            <div className="bg-purple-50 rounded p-1.5 text-center">
              <div className="text-xs text-gray-500">Prot</div>
              <span
                className="text-sm font-medium text-purple-700"
                dangerouslySetInnerHTML={{
                  __html: `${meal.nutritionalInfo.protein}g${
                    isSelected
                      ? formatImpact(nutritionalImpact?.protein) + "g"
                      : ""
                  }`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Primary Health Benefit */}
        {healthBenefits && healthBenefits.length > 0 && (
          <div className="mt-3 pt-2 border-t border-green-100">
            <div className="bg-green-100 rounded-md p-2 text-xs text-green-800 text-center">
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

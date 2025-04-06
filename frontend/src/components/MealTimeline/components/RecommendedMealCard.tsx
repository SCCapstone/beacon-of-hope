import React from "react";
import { motion } from "framer-motion";
import { MealRecommendation } from "../types";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

interface RecommendedMealCardProps {
  recommendation: MealRecommendation;
  onClick: () => void; // For selecting to view details
  onAccept: () => void; // Handler for accept button click
  onReject: () => void; // Handler for reject button click
  isSelected: boolean;
  className?: string;
}

// Helper function
const isMealDiabetesFriendly = (meal: MealRecommendation["meal"]): boolean => {
  return meal.diabetesFriendly ?? false; // Use the pre-calculated value, default to false
};

export const RecommendedMealCard: React.FC<RecommendedMealCardProps> = ({
  recommendation,
  onClick,
  onAccept,
  onReject,
  isSelected,
  className = "",
}) => {
  // Use the score directly from the recommendation object
  const { meal, score, nutritionalImpact, healthBenefits } = recommendation;
  const diabetesFriendly = isMealDiabetesFriendly(meal);
  const { nutritionalInfo } = meal;

  // Calculate macro percentages (keep as is)
  const totalMacros =
    (nutritionalInfo?.carbs ?? 0) + (nutritionalInfo?.protein ?? 0);
  const carbPercent =
    totalMacros > 0 ? ((nutritionalInfo?.carbs ?? 0) / totalMacros) * 100 : 0;
  const proteinPercent =
    totalMacros > 0 ? ((nutritionalInfo?.protein ?? 0) / totalMacros) * 100 : 0;

  // Format impact for display (keep as is, but use optional chaining)
  const formatImpact = (value: number | undefined): string => {
    if (value === undefined || value === 0 || !isSelected) return "";
    const prefix = value > 0 ? "+" : "";
    const color =
      value > 0
        ? "text-green-600"
        : value < 0
        ? "text-red-600"
        : "text-gray-500";
    return `<span class="${color} text-[10px] ml-1">(${prefix}${value})</span>`;
  };

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    onAccept();
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    onReject();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${className} recommendation-card relative p-3 mb-3 rounded-lg cursor-pointer
        transform transition-all duration-300
        ${
          isSelected
            ? "ring-2 ring-green-500"
            : "border border-dashed border-green-300"
        }
        bg-green-50/50
        backdrop-blur-sm flex flex-col min-h-[180px]`} // Match min-height and padding
      style={{
        boxShadow: isSelected
          ? "0 0 10px rgba(16, 185, 129, 0.15)" // Reduced shadow
          : "0 1px 2px rgba(0,0,0,0.03)",
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
        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full shadow-sm">
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
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-gray-800 truncate pr-16">
            {meal.name}
          </h3>
          <div
            className="text-xs font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-full whitespace-nowrap"
            dangerouslySetInnerHTML={{
              __html: `${nutritionalInfo?.calories ?? 0} cal${formatImpact(
                nutritionalImpact?.calories
              )}`,
            }}
          />
        </div>

        {/* Macro Visualization */}
        <div className="flex h-1.5 rounded-full overflow-hidden my-2">
          <div
            className="bg-blue-400"
            style={{ width: `${carbPercent}%` }}
            title={`Carbs: ${nutritionalInfo?.carbs ?? 0}g`}
          />
          <div
            className="bg-purple-400"
            style={{ width: `${proteinPercent}%` }}
            title={`Protein: ${nutritionalInfo?.protein ?? 0}g`}
          />
        </div>

        {/* Footer Indicators */}
        <div className="mt-auto pt-2 border-t border-green-100 flex justify-between items-center text-xs">
          <span className="text-gray-500 capitalize">{meal.type}</span>
          <div className="flex items-center space-x-2">
            {diabetesFriendly && (
              <span
                className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full"
                title="Diabetes Friendly"
              >
                DF
              </span>
            )}
          </div>
        </div>

        {/* Primary Health Benefit (Use dynamic benefit) */}
        {healthBenefits && healthBenefits.length > 0 && (
          <div className="mt-3 pt-2 border-t border-green-100">
            <div className="bg-green-100 rounded-md p-2 text-xs text-green-800 text-center">
              <span className="font-medium">Benefit:</span> {healthBenefits[0]}
            </div>
          </div>
        )}

        {/* Action Buttons (keep as is) */}
        <div className="absolute bottom-2 right-2 flex space-x-1.5 z-10">
          <motion.button
            whileHover={{
              scale: 1.1,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRejectClick}
            className="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
            title="Reject Recommendation"
          >
            <XMarkIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{
              scale: 1.1,
              backgroundColor: "rgba(34, 197, 94, 0.1)",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAcceptClick}
            className="p-1.5 rounded-full text-green-600 hover:bg-green-50 transition-colors"
            title="Accept Recommendation"
          >
            <CheckIcon className="w-4 h-4" />
          </motion.button>
        </div>
        {/* --- End Action Buttons --- */}
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

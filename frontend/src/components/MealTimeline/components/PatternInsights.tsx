import React from "react";
import { motion } from "framer-motion";
import {
  MealPattern,
  Meal,
  Food,
  Ingredient,
  VisualizationLevel,
  ManagementTip,
} from "../types";

interface PatternInsightsProps {
  patterns: MealPattern | null;
  currentLevel: VisualizationLevel["type"];
  selectedMeal: Meal | null;
  selectedFood: Food | null;
  selectedIngredient: Ingredient | null;
  managementTips: ManagementTip[];
}

export const PatternInsights: React.FC<PatternInsightsProps> = ({
  patterns,
  selectedMeal,
  managementTips,
}) => {
  if (!patterns) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-500 text-sm text-center">
          No patterns available
        </p>
      </div>
    );
  }

  const relevantTips = managementTips.find(
    (tip) => tip.mealType === (selectedMeal?.type || "breakfast")
  );

  return (
    <div className="space-y-4">
      {/* Health Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-sm p-4 flex-shrink-0 border border-gray-200"
      >
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Health Insights
        </h4>
        <div className="space-y-2">
          {patterns.healthInsights.diabetesImpact && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-green-50 rounded-md"
            >
              <span className="text-sm text-green-700">
                {patterns.healthInsights.diabetesImpact}
              </span>
            </motion.div>
          )}

          {patterns.healthInsights.culturalAlignment && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-purple-50 rounded-md"
            >
              <span className="text-sm text-purple-700">
                {patterns.healthInsights.culturalAlignment}
              </span>
            </motion.div>
          )}

          {patterns.healthInsights.nutritionalBalance && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-orange-50 rounded-md"
            >
              <span className="text-sm text-orange-700">
                {patterns.healthInsights.nutritionalBalance}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Recommendations Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-sm p-4 flex-shrink-0 border border-gray-200"
      >
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Recommendations
        </h4>
        <div className="space-y-2">
          {patterns.recommendations.slice(0, 3).map((rec, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-blue-50 rounded-md"
            >
              <p className="text-sm text-blue-700">{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Diabetes Management Tips Box */}
      {relevantTips && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-sm p-4 flex-shrink-0 border border-gray-200"
        >
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Diabetes Management Tips
          </h4>
          <div className="space-y-2">
            {relevantTips.tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-2 bg-green-50 rounded-md text-sm text-green-700"
              >
                {tip}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

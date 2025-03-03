import React from "react";
import { motion } from "framer-motion";

interface NutritionalGoals {
  dailyCalories: number;
  carbohydrates: {
    min: number;
    max: number;
    unit: string;
  };
  protein: {
    min: number;
    max: number;
    unit: string;
  };
  fiber: {
    daily: number;
    unit: string;
  };
}

interface NutritionalGoalsProgressProps {
  goals: NutritionalGoals;
  currentValues: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
}

export const NutritionalGoalsProgress: React.FC<
  NutritionalGoalsProgressProps
> = ({ goals, currentValues }) => {
  const calculateProgress = (current: number, target: number) =>
    Math.min((current / target) * 100, 100);

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Calories Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-gray-700">
          <span className="font-semibold">Calories</span>
          <span className="text-gray-600">
            {currentValues.calories} / {goals.dailyCalories}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${calculateProgress(
                currentValues.calories,
                goals.dailyCalories
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Carbohydrates Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-gray-700">
          <span className="font-semibold">Carbohydrates</span>
          <span className="text-gray-600">
            {currentValues.carbs}
            {goals.carbohydrates.unit}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${calculateProgress(
                currentValues.carbs,
                goals.carbohydrates.max
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Protein Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-gray-700">
          <span className="font-semibold">Protein</span>
          <span className="text-gray-600">
            {currentValues.protein}
            {goals.protein.unit}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${calculateProgress(
                currentValues.protein,
                goals.protein.max
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Fiber Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-gray-700">
          <span className="font-semibold">Fiber</span>
          <span className="text-gray-600">
            {currentValues.fiber}
            {goals.fiber.unit} / {goals.fiber.daily}
            {goals.fiber.unit}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-orange-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${calculateProgress(
                currentValues.fiber,
                goals.fiber.daily
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

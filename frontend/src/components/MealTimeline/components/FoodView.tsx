import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Food } from "../types";
import { format, isSameDay } from "date-fns";
import { FoodTypeIcon } from "./FoodTypeIcon";
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

interface FoodViewProps {
  datesToDisplay: DayMeals[];
  allData: DayMeals[];
  onFoodSelect: (food: Food | null) => void;
  selectedFood: Food | null;
  mealBinNames: string[];
  onMealBinUpdate: (newBinNames: string[]) => void;
}

// Placeholder Food Card Component
const FoodCard: React.FC<{
  food: Food;
  isSelected: boolean;
  onClick: () => void;
}> = ({ food, isSelected, onClick }) => {
  return (
    <motion.div
      key={`food-${food.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-3 mb-2 rounded-lg cursor-pointer text-xs
        bg-white shadow-sm hover:shadow transition-all duration-300
        ${isSelected ? "ring-2 ring-purple-500" : "border border-gray-200"}
        flex items-center space-x-2`}
      onClick={onClick}
    >
      <FoodTypeIcon
        type={food.type}
        className="w-4 h-4 text-gray-600 flex-shrink-0"
      />
      <div className="flex-grow overflow-hidden">
        <h4 className="font-medium text-gray-800 truncate">{food.name}</h4>
        <p className="text-gray-500 capitalize">
          {food.type.replace("_", " ")}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-gray-700 font-medium">
          {food.nutritionalInfo.calories} cal
        </div>
        {food.diabetesFriendly && (
          <span className="mt-1 inline-block px-1 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full">
            DF
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const FoodView: React.FC<FoodViewProps> = ({
  datesToDisplay,
  allData,
  onFoodSelect,
  selectedFood,
  mealBinNames,
  onMealBinUpdate,
}) => {
  // Helper to get all unique foods for a given date and potentially bin
  // For simplicity now, let's get all foods for the date first
  const getFoodsForDate = useCallback(
    (targetDate: Date): Food[] => {
      const dayData = allData.find((day) =>
        isSameDay(normalizeDate(new Date(day.date)), normalizeDate(targetDate))
      );
      if (!dayData) return [];

      const allFoods: Food[] = [];
      const foodIds = new Set<string>(); // Track unique food IDs

      dayData.meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          if (!foodIds.has(food.id)) {
            allFoods.push(food);
            foodIds.add(food.id);
          }
        });
      });
      return allFoods;
    },
    [allData]
  );

  // TODO: Implement logic to distribute foods into bins if needed, similar to organizeMealsIntoBins
  // For now, we'll just list all foods in the first bin for simplicity.
  const organizeFoodsIntoBins = useCallback(
    (date: Date) => {
      const foods = getFoodsForDate(date);
      const bins: Record<string, Food[]> = {};

      mealBinNames.forEach((name) => {
        bins[name] = [];
      });

      // Simple distribution: put all foods in the first bin for now
      if (mealBinNames.length > 0) {
        bins[mealBinNames[0]] = foods;
      }
      // More complex logic needed here to distribute based on meal time or type

      // Check if bin count needs update (similar to MealView)
      if (foods.length > mealBinNames.length && mealBinNames.length > 0) {
        // Simplified: just check total foods vs bins
        const requiredBins = Math.ceil(foods.length / 5); // Example: 5 foods per bin max
        if (requiredBins > mealBinNames.length) {
          const newNames = [...mealBinNames];
          while (newNames.length < requiredBins) {
            newNames.push(`Bin ${newNames.length + 1}`);
          }
          onMealBinUpdate(newNames);
        }
      }

      return bins;
    },
    [getFoodsForDate, mealBinNames, onMealBinUpdate]
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden box-border">
      {/* Fixed header for bins */}
      <div className="flex border-b bg-white z-10 sticky top-0">
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700 border-r">
          Date
        </div>
        {mealBinNames.map((binName, index) => (
          <div
            key={binName}
            className={`flex-1 p-4 text-center font-medium text-gray-700 ${
              index > 0 ? "border-l" : ""
            }`}
          >
            {binName} {/* Or maybe Food Category? */}
          </div>
        ))}
      </div>

      {/* Scrollable container */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="min-h-full flex flex-col">
          {datesToDisplay.map((currentDate) => {
            const bins = organizeFoodsIntoBins(currentDate.date);
            return (
              <div
                key={currentDate.date.toISOString()}
                className="flex flex-1 min-h-[150px] border-b last:border-b-0 bg-white"
              >
                {/* Date Cell */}
                <div className="w-32 flex-shrink-0 p-4 border-r flex flex-col justify-start">
                  <div className="font-semibold text-gray-800">
                    {format(currentDate.date, "EEE")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(currentDate.date, "MMM d")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(currentDate.date, "yyyy")}
                  </div>
                </div>

                {/* Food Bins */}
                <div className="flex flex-1">
                  {mealBinNames.map((binName, index) => (
                    <div
                      key={`${currentDate.date.toISOString()}-${binName}`}
                      className={`flex-1 p-4 overflow-y-auto ${
                        index > 0 ? "border-l" : ""
                      }`}
                    >
                      <AnimatePresence>
                        {bins[binName]?.map((food) => (
                          <FoodCard
                            key={food.id}
                            food={food}
                            isSelected={selectedFood?.id === food.id}
                            onClick={() =>
                              onFoodSelect(
                                selectedFood?.id === food.id ? null : food
                              )
                            }
                          />
                        ))}
                      </AnimatePresence>
                      {/* Empty State */}
                      {!bins[binName] ||
                        (bins[binName].length === 0 && (
                          <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                            No foods
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

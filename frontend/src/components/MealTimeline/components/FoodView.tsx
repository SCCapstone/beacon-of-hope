import React, { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Food, MealRecommendation } from "../types";
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
  selectedRecommendation: MealRecommendation | null;
  selectedDate: Date;
}

// Food Card Component
const FoodCard: React.FC<{
  food: Food;
  isSelected: boolean;
  isRecommended: boolean;
  onClick: () => void;
}> = ({ food, isSelected, isRecommended, onClick }) => {
  const totalTime = food.preparationTime + food.cookingTime;
  const timeIndicator =
    totalTime <= 15
      ? { text: "<15m", color: "bg-green-100 text-green-800" }
      : totalTime <= 30
      ? { text: "15-30m", color: "bg-yellow-100 text-yellow-800" }
      : { text: ">30m", color: "bg-red-100 text-red-800" };

  return (
    <motion.div
      key={`food-${food.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative p-3 mb-2 rounded-lg cursor-pointer text-xs
        bg-white shadow-sm hover:shadow transition-all duration-300
        ${isSelected ? "ring-2 ring-purple-500" : "border border-gray-200"}
        ${isRecommended ? "border-green-400 border-l-4 pl-2" : ""} // Recommended style
        flex items-center space-x-2`}
      onClick={onClick}
    >
      {isRecommended && (
        <span className="absolute -top-1.5 -left-1.5 text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full z-10">
          Rec
        </span>
      )}
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
      <div className="text-right flex-shrink-0 space-y-1">
        <div className="text-gray-700 font-medium">
          {food.nutritionalInfo.calories} cal
        </div>
        <div className="flex items-center justify-end space-x-1">
          {food.diabetesFriendly && (
            <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full" title="Diabetes Friendly">
              DF
            </span>
          )}
          {totalTime > 0 && (
             <span className={`inline-block px-1 py-0.5 ${timeIndicator.color} text-[10px] rounded-full`} title={`Prep+Cook: ${totalTime}min`}>
              {timeIndicator.text}
            </span>
          )}
        </div>
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
  selectedRecommendation,
  selectedDate,
}) => {
    // Memoize the set of recommended food IDs for the selected date
    const recommendedFoodIds = useMemo(() => {
      const ids = new Set<string>();
      if (
        selectedRecommendation &&
        selectedRecommendation.meal.date &&
        isSameDay(normalizeDate(selectedRecommendation.meal.date), normalizeDate(selectedDate)) // Compare recommendation's date with the currently selected view date
      ) {
        selectedRecommendation.meal.foods.forEach((food) => ids.add(food.id));
      }
      return ids;
    }, [selectedRecommendation, selectedDate]);

  // Helper to get all unique foods for a given date and potentially bin
  // For simplicity now, let's get all foods for the date first
  const getFoodsForDate = useCallback(
    (targetDate: Date): Food[] => {
      const dayData = allData.find((day) =>
        isSameDay(normalizeDate(new Date(day.date)), normalizeDate(targetDate))
      );
      if (!dayData) return [];

      const allFoods: Food[] = [];
      const foodIds = new Set<string>();

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

      // Auto-adjust bin count (simplified)
      if (foods.length > mealBinNames.length * 5 && mealBinNames.length > 0) { // Example: 5 foods per bin max
        const requiredBins = Math.ceil(foods.length / 5);
        if (requiredBins > mealBinNames.length) {
          const newNames = [...mealBinNames];
          while (newNames.length < requiredBins) {
            newNames.push(`Bin ${newNames.length + 1}`);
          }
          // Defer update to avoid state change during render
          setTimeout(() => onMealBinUpdate(newNames), 0);
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
            {binName}
          </div>
        ))}
      </div>

      {/* Scrollable container */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="min-h-full flex flex-col">
          {datesToDisplay.map((currentDateData) => {
            const currentDate = currentDateData.date; // Get the date object
            const bins = organizeFoodsIntoBins(currentDate);
            // Check against the date being currently rendered in the loop
            const isCurrentDateSelectedForRecCheck = selectedRecommendation?.meal.date && isSameDay(normalizeDate(selectedRecommendation.meal.date), normalizeDate(currentDate));

            return (
              <div
                key={currentDate.toISOString()}
                className="flex flex-1 min-h-[150px] border-b last:border-b-0 bg-white"
              >
                {/* Date Cell */}
                <div className="w-32 flex-shrink-0 p-4 border-r flex flex-col justify-start">
                  <div className="font-semibold text-gray-800">
                    {format(currentDate, "EEE")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(currentDate, "MMM d")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(currentDate, "yyyy")}
                  </div>
                </div>

                {/* Food Bins */}
                <div className="flex flex-1">
                  {mealBinNames.map((binName, index) => (
                    <div
                      key={`${currentDate.toISOString()}-${binName}`}
                      className={`flex-1 p-2 overflow-y-auto ${
                        index > 0 ? "border-l" : ""
                      }`}
                    >
                      <AnimatePresence>
                        {bins[binName]?.map((food) => (
                          <FoodCard
                            key={food.id}
                            food={food}
                            isSelected={selectedFood?.id === food.id}
                            // Check if food is recommended for the selected date
                            isRecommended={!!isCurrentDateSelectedForRecCheck && recommendedFoodIds.has(food.id)}
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

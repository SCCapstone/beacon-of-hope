import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Food, MealRecommendation, DayRecommendations } from "../types";
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
  recommendationData: DayRecommendations[];
  onFoodSelect: (food: Food | null, isRecommended?: boolean) => void;
  selectedFood: Food | null;
  mealBinNames: string[];
  onMealBinUpdate: (newBinNames: string[]) => void;
  selectedRecommendation: MealRecommendation | null; // Kept for highlighting/simulation
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

  // Defensive check for nutritionalInfo
  const calories = food.nutritionalInfo?.calories ?? 0;

  return (
    <motion.div
      key={`food-${food.id}-${isRecommended}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className={`food-card-item relative p-2.5 mb-2 rounded-lg cursor-pointer text-xs
        ${
          isRecommended
            ? "bg-green-50/60 border border-dashed border-green-300" // Rec style
            : "bg-white shadow-sm border border-gray-200" // Trace style
        }
        ${isSelected ? "ring-2 ring-purple-500" : ""} // Selection style
        hover:shadow-md transition-all duration-200
        flex items-center space-x-2`}
      onClick={onClick}
    >
      {isRecommended && (
        <span className="absolute -top-1.5 -left-1.5 text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full z-10 shadow-sm">
          Rec
        </span>
      )}
      <FoodTypeIcon
        type={food.type}
        className="w-5 h-5 text-gray-600 flex-shrink-0"
      />
      <div className="flex-grow overflow-hidden">
        <h4 className="font-medium text-gray-800 truncate">{food.name}</h4>
        <p className="text-gray-500 capitalize">
          {food.type.replace("_", " ")}
        </p>
      </div>
      <div className="text-right flex-shrink-0 space-y-1">
        <div className="text-gray-700 font-medium">{calories} cal</div>
        <div className="flex items-center justify-end space-x-1">
          {food.diabetesFriendly && (
            <span
              className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full"
              title="Diabetes Friendly"
            >
              DF
            </span>
          )}
          {totalTime > 0 && (
            <span
              className={`inline-block px-1 py-0.5 ${timeIndicator.color} text-[10px] rounded-full`}
              title={`Prep+Cook: ${totalTime}min`}
            >
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
  recommendationData, // Destructure the new prop
  onFoodSelect,
  selectedFood,
  mealBinNames,
  onMealBinUpdate,
  // selectedRecommendation, // Kept for highlighting/simulation
}) => {
  const getCombinedFoodsForDate = useCallback(
    (targetDate: Date): Array<Food & { isRecommended: boolean }> => {
      console.log(`FoodView: getCombinedFoodsForDate for ${format(targetDate, "yyyy-MM-dd")}`);
      const normalizedTargetDate = normalizeDate(targetDate);

      // 1. Get Trace Foods
      const dayData = allData.find((day) =>
        isSameDay(normalizeDate(new Date(day.date)), normalizedTargetDate)
      );
      const traceFoods: Food[] = [];
      const traceFoodIds = new Set<string>();
      if (dayData) {
        (dayData.meals || []).forEach((meal) => {
          (meal.foods || []).forEach((food) => {
            if (food && food.id && !traceFoodIds.has(food.id)) {
              traceFoods.push(food);
              traceFoodIds.add(food.id);
            }
          });
        });
      }
      console.log(` -> Found ${traceFoods.length} trace foods.`);

      // 2. Get ALL Recommended Foods for this date from recommendationData
      const dayRecommendations = recommendationData.find((dayRec) =>
        isSameDay(normalizeDate(new Date(dayRec.date)), normalizedTargetDate)
      );

      const allRecommendedFoodsForDate: Food[] = [];
      const allRecommendedFoodIdsForDate = new Set<string>();

      if (dayRecommendations) {
        (dayRecommendations.recommendations || []).forEach((rec) => {
          (rec.meal.foods || []).forEach((food) => {
            if (food && food.id) {
              allRecommendedFoodIdsForDate.add(food.id);
              // Add to list only if not already added from another recommendation for the same date
              if (!allRecommendedFoodsForDate.some(f => f.id === food.id)) {
                 allRecommendedFoodsForDate.push(food);
              }
            }
          });
        });
      }
      console.log(` -> Found ${allRecommendedFoodsForDate.length} unique recommended foods for this date from recommendationData.`);


      // 3. Filter recommended foods to only include those *not* already in traces
      const uniqueNewRecommendedFoods = allRecommendedFoodsForDate.filter(
          (food) => food && food.id && !traceFoodIds.has(food.id) // Add defensive check for food.id
      );
      console.log(` -> Found ${uniqueNewRecommendedFoods.length} recommended foods not present in trace.`);


      // 4. Combine and Mark
      const combinedFoods = [
        ...traceFoods.map((food) => ({
          ...food,
          // Mark as recommended if its ID exists in the full set of recommended IDs for the date
          isRecommended: allRecommendedFoodIdsForDate.has(food.id),
        })),
        ...uniqueNewRecommendedFoods.map((food) => ({
          ...food,
          isRecommended: true, // It's inherently recommended
        })),
      ];
      console.log(` -> Total combined foods for ${format(targetDate, "yyyy-MM-dd")}: ${combinedFoods.length}`);

      combinedFoods.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      });

      return combinedFoods;
    },
    [allData, recommendationData]
  );

  // organizeFoodsIntoBins remains largely the same, but uses the result of the updated getCombinedFoodsForDate
  const organizeFoodsIntoBins = useCallback(
    (date: Date) => {
      const foods = getCombinedFoodsForDate(date); // Use the combined list
      const bins: Record<string, Array<Food & { isRecommended: boolean }>> = {};

      mealBinNames.forEach((name) => {
        bins[name] = [];
      });

      // Simple distribution: put all foods in the first bin for now
      // TODO: Implement better binning if needed
      if (mealBinNames.length > 0 && foods.length > 0) {
        bins[mealBinNames[0]] = foods;
        console.log(
          `FoodView: Distributed ${foods.length} foods into bin '${
            mealBinNames[0]
          }' for ${format(date, "yyyy-MM-dd")}`
        );
      } else if (foods.length > 0) {
        console.warn(
          `FoodView: No meal bins available to distribute ${
            foods.length
          } foods for ${format(date, "yyyy-MM-dd")}`
        );
      }

      // TODO: Auto-adjust bin count (simplified)
      if (foods.length > mealBinNames.length * 5 && mealBinNames.length > 0) {
        // Example: 5 foods per bin max
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
    [getCombinedFoodsForDate, mealBinNames, onMealBinUpdate]
  );

  console.log(
    `FoodView: Rendering component. Dates to display: ${
      datesToDisplay.length
    }, Bins: ${mealBinNames.join(", ")}`
  );
  if (!datesToDisplay || datesToDisplay.length === 0) {
    console.warn("FoodView: No datesToDisplay provided.");
  }

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
            // Defensive check for valid date object
            if (
              !currentDateData ||
              !(currentDateData.date instanceof Date) ||
              isNaN(currentDateData.date.getTime())
            ) {
              console.error(
                "FoodView: Invalid date object encountered in datesToDisplay",
                currentDateData
              );
              return null; // Skip rendering for invalid date
            }
            const currentDate = currentDateData.date;
            const bins = organizeFoodsIntoBins(currentDate);
            console.log(
              `FoodView: Rendering row for date ${format(
                currentDate,
                "yyyy-MM-dd"
              )}. Bins object keys:`,
              Object.keys(bins)
            );

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
                  {mealBinNames.map((binName, index) => {
                    // Log the content of the specific bin being rendered
                    const binContent = bins[binName];
                    console.log(
                      ` -> Rendering Bin '${binName}' for ${format(
                        currentDate,
                        "yyyy-MM-dd"
                      )}. Items: ${binContent?.length ?? 0}`
                    );
                    if (binContent && binContent.length > 0) {
                      console.log(
                        "   -> Bin Content:",
                        binContent.map((f) => ({
                          name: f.name,
                          id: f.id,
                          isRec: f.isRecommended,
                        }))
                      );
                    }

                    return (
                      <div
                        key={`${currentDate.toISOString()}-${binName}`}
                        className={`flex-1 p-2 overflow-y-auto ${
                          // Vertical list layout
                          index > 0 ? "border-l" : ""
                        }`}
                      >
                        <AnimatePresence>
                          {binContent?.map((food) => ( // food here includes isRecommended
                            <FoodCard
                              key={`${food.id}-${food.isRecommended}`}
                              food={food}
                              isSelected={selectedFood?.id === food.id}
                              isRecommended={food.isRecommended} // Pass isRecommended status
                              onClick={() => {
                                console.log(`FoodView: Clicked on ${food.name} (Recommended: ${food.isRecommended}). Current selected: ${selectedFood?.id}. Calling onFoodSelect.`);
                                // Toggle selection: if already selected, pass null, otherwise pass the food and its recommended status
                                onFoodSelect(
                                  selectedFood?.id === food.id ? null : food,
                                  food.isRecommended // Pass the flag here
                                );
                              }}
                            />
                          ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {(!binContent || binContent.length === 0) && (
                          <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                            No foods
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

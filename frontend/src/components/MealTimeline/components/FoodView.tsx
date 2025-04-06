import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Food,
  MealRecommendation,
  DayRecommendations,
} from "../types";
import {
  format,
  isSameDay,
  startOfDay,
  parseISO,
  isValid as isValidDate,
} from "date-fns";
import { FoodTypeIcon } from "./FoodTypeIcon";

// Robust date normalization
const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    console.warn(
      "FoodView normalizeDate received null/undefined, returning current date."
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn(
      "FoodView normalizeDate received invalid date, returning current date:",
      date
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  return startOfDay(dateObj); // Use startOfDay for robust normalization
};

// Use isSameDay from date-fns for consistency
const isSameNormalizedDay = (
  date1: Date | string | null | undefined,
  date2: Date | string | null | undefined
): boolean => {
  if (!date1 || !date2) return false;
  // Ensure both are normalized Date objects before comparing
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  // Check if normalization resulted in valid dates before comparing
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return isSameDay(d1, d2);
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
  recommendationData,
  onFoodSelect,
  selectedFood,
  mealBinNames,
  onMealBinUpdate,
}) => {
  const getCombinedFoodsForDate = useCallback(
    (targetDate: Date): Array<Food & { isRecommended: boolean }> => {
      const normalizedTargetDate = normalizeDate(targetDate);
      if (!isValidDate(normalizedTargetDate)) return [];

      console.log(
        `FoodView: getCombinedFoodsForDate for ${format(
          normalizedTargetDate,
          "yyyy-MM-dd"
        )}`
      );

      // 1. Get Trace Foods for the specific date from datesToDisplay
      const dayData = datesToDisplay.find((day) =>
        isSameNormalizedDay(day.date, normalizedTargetDate)
      );
      const traceFoods: Food[] = [];
      if (dayData) {
        (dayData.meals || []).forEach((meal) => {
          (meal.foods || []).forEach((food) => {
            if (food && food.id) {
              // Ensure food and food.id exist
              // Avoid adding duplicates within the trace itself for this view
              if (!traceFoods.some((tf) => tf.id === food.id)) {
                traceFoods.push(food);
              }
            }
          });
        });
      }
      console.log(
        ` -> Found ${traceFoods.length} unique trace foods from datesToDisplay.`
      );

      // 2. Get Recommended Foods for this date from recommendationData
      const dayRecommendations = recommendationData.find((dayRec) =>
        isSameNormalizedDay(dayRec.date, normalizedTargetDate)
      );
      const recommendedFoods: Food[] = [];
      if (dayRecommendations) {
        (dayRecommendations.recommendations || []).forEach((rec) => {
          (rec.meal.foods || []).forEach((food) => {
            if (food && food.id) {
              // Ensure food and food.id exist
              // Avoid adding duplicates within recommendations for this view
              if (!recommendedFoods.some((rf) => rf.id === food.id)) {
                recommendedFoods.push(food);
              }
            }
          });
        });
      }
      console.log(
        ` -> Found ${recommendedFoods.length} unique recommended foods from recommendationData.`
      );

      // 3. Combine using a Map to handle overlaps and set isRecommended flag
      const combinedFoodMap = new Map<
        string,
        Food & { isRecommended: boolean }
      >();

      // Add trace foods first
      traceFoods.forEach((food) => {
        combinedFoodMap.set(food.id, { ...food, isRecommended: false });
      });

      // Add/update with recommended foods
      recommendedFoods.forEach((food) => {
        if (combinedFoodMap.has(food.id)) {
          // If already present from trace, just update the flag
          const existing = combinedFoodMap.get(food.id)!;
          combinedFoodMap.set(food.id, { ...existing, isRecommended: true });
        } else {
          // If not present, add it as recommended
          combinedFoodMap.set(food.id, { ...food, isRecommended: true });
        }
      });

      // 4. Convert map back to array and sort
      const combinedFoods = Array.from(combinedFoodMap.values());
      combinedFoods.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      });

      console.log(
        ` -> Total combined foods for ${format(
          normalizedTargetDate,
          "yyyy-MM-dd"
        )}: ${combinedFoods.length}`
      );
      return combinedFoods;
    },
    [datesToDisplay, recommendationData]
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
                      className={`flex-1 p-2 w-full flex flex-col items-stretch justify-center overflow-y-auto ${
                        index > 0 ? "border-l" : ""
                      }`}
                      >
                        <AnimatePresence>
                          {binContent?.map(
                            (
                              food // food here includes isRecommended
                            ) => (
                              <FoodCard
                                key={`${food.id}-${food.isRecommended}`}
                                food={food}
                                isSelected={selectedFood?.id === food.id}
                                isRecommended={food.isRecommended} // Pass isRecommended status
                                onClick={() => {
                                  console.log(
                                    `FoodView: Clicked on ${food.name} (Recommended: ${food.isRecommended}). Current selected: ${selectedFood?.id}. Calling onFoodSelect.`
                                  );
                                  // Toggle selection: if already selected, pass null, otherwise pass the food and its recommended status
                                  onFoodSelect(
                                    selectedFood?.id === food.id ? null : food,
                                    food.isRecommended // Pass the flag here
                                  );
                                }}
                              />
                            )
                          )}
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

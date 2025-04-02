import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Meal } from "../types";
import { format, isSameDay } from "date-fns";
import { RecommendedMealCard } from "./RecommendedMealCard";
import { MealRecommendation, DayRecommendations } from "../types";
import { FoodTypeIcon } from "./FoodTypeIcon";

interface MealViewProps {
  datesToDisplay: Date[];
  allData: DayMeals[]; // All loaded data for lookups
  recommendationData: DayRecommendations[];
  selectedDate: Date;
  onMealSelect: (meal: Meal | null) => void;
  selectedMeal: Meal | null;
  onRecommendationSelect: (recommendation: MealRecommendation | null) => void;
  selectedRecommendation: MealRecommendation | null;
  mealBinNames: string[];
  onMealBinUpdate: (newBinNames: string[]) => void;
  isLoading?: boolean;
}

// Helper function
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const MealView: React.FC<MealViewProps> = ({
  datesToDisplay,
  allData,
  recommendationData,
  selectedDate,
  onMealSelect,
  selectedMeal,
  onRecommendationSelect,
  selectedRecommendation,
  mealBinNames,
  onMealBinUpdate,
  isLoading = false,
}) => {
  // const mainAreaRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-500">Loading your meal data...</p>
        </div>
      </div>
    );
  }

  // // Get adjacent dates
  // const previousDate = subDays(selectedDate, 1);
  // const nextDate = addDays(selectedDate, 1);

  // Get data for a specific date from allData ***
  const getDataForDate = useCallback(
    (targetDate: Date): DayMeals | undefined => {
      return allData.find((day) =>
        isSameDay(normalizeDate(new Date(day.date)), normalizeDate(targetDate))
      );
    },
    [allData]
  );

  // Get meals for a specific date using getDataForDate
  const getMealsForDate = useCallback(
    (targetDate: Date): Meal[] => {
      const dayData = getDataForDate(targetDate);
      return dayData?.meals || [];
    },
    [getDataForDate]
  );

  // Keep getRecommendationsForDate (adapt if needed based on recommendationData structure)
  const getRecommendationsForDate = useCallback(
    (targetDate: Date): MealRecommendation[] => {
      const dayRecs = recommendationData.find((day) =>
        isSameDay(normalizeDate(new Date(day.date)), normalizeDate(targetDate))
      );
      return dayRecs?.recommendations || [];
    },
    [recommendationData]
  );

  // Organize meals into bins for each date
  const organizeMealsIntoBins = useCallback(
    (date: Date) => {
      const meals = getMealsForDate(date);
      const recommendations = getRecommendationsForDate(date);

      // Define meal type priority for sorting (breakfast, lunch, dinner, snack)
      const mealTypePriority = {
        breakfast: 0,
        lunch: 1,
        dinner: 2,
        snack: 3,
      };

      // Sort all meals by time, then by meal type priority if times are the same
      const sortedMeals = [...meals].sort((a, b) => {
        const timeA = a.time.split(":").map(Number);
        const timeB = b.time.split(":").map(Number);

        // First compare by time
        const timeCompare =
          timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);

        // If times are the same, sort by meal type priority
        if (timeCompare === 0) {
          return mealTypePriority[a.type] - mealTypePriority[b.type];
        }

        return timeCompare;
      });

      // Sort all recommendations by time, then by meal type priority if times are the same
      const sortedRecommendations = [...recommendations].sort((a, b) => {
        const timeA = a.meal.time.split(":").map(Number);
        const timeB = b.meal.time.split(":").map(Number);

        // First compare by time
        const timeCompare =
          timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);

        // If times are the same, sort by meal type priority
        if (timeCompare === 0) {
          return mealTypePriority[a.meal.type] - mealTypePriority[b.meal.type];
        }

        return timeCompare;
      });

      // Create time slots for all items (meals and recommendations)
      const allItems = [
        ...sortedMeals.map((meal) => ({
          type: "meal",
          item: meal,
          time: meal.time,
        })),
        ...sortedRecommendations.map((rec) => ({
          type: "recommendation",
          item: rec,
          time: rec.meal.time,
        })),
      ].sort((a, b) => {
        const timeA = a.time.split(":").map(Number);
        const timeB = b.time.split(":").map(Number);
        const timeCompare =
          timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);

        // If times are the same, sort by item type (meal vs recommendation)
        if (timeCompare === 0) {
          // Prioritize actual meals over recommendations
          return a.type === "meal" ? -1 : 1;
        }

        return timeCompare;
      });

      // Check if we need more bins than currently available
      if (allItems.length > mealBinNames.length) {
        // Request parent component to update bin names
        const newBinNames = [...mealBinNames];
        while (newBinNames.length < allItems.length) {
          newBinNames.push(`Meal ${newBinNames.length + 1}`);
        }
        // This will trigger a re-render with the updated bin names
        onMealBinUpdate(newBinNames);
      }

      // Create bins based on meal times
      const bins: Record<
        string,
        { meals: Meal[]; recommendations: MealRecommendation[] }
      > = {};

      // Initialize bins with empty arrays
      mealBinNames.forEach((name) => {
        bins[name] = { meals: [], recommendations: [] };
      });

      // Distribute items to bins, ensuring one item per bin
      allItems.forEach((item, index) => {
        // Skip if we've run out of bins (this shouldn't happen after the fix)
        if (index >= mealBinNames.length) return;

        const binName = mealBinNames[index];

        if (item.type === "meal") {
          bins[binName].meals = [item.item as Meal];
        } else {
          bins[binName].recommendations = [item.item as MealRecommendation];
        }
      });

      return bins;
    },
    [getMealsForDate, getRecommendationsForDate, mealBinNames, onMealBinUpdate]
  );

  const isMealSelected = (meal: Meal) => {
    return selectedMeal?.id === meal.id;
  };

  // Function to render a meal card
  const renderMealCard = (meal: Meal, date: Date) => {
    // Pass date for unique key
    return (
      <motion.div
        key={`meal-${meal.id}-${date.toISOString()}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`meal-card p-4 mb-4 rounded-lg cursor-pointer
          bg-white shadow-sm hover:shadow transition-all duration-300
          ${
            isMealSelected(meal)
              ? "ring-2 ring-blue-500"
              : "border border-gray-200"
          }
          flex flex-col h-full`}
        onClick={() => onMealSelect(isMealSelected(meal) ? null : meal)}
      >
        {/* Header with meal name and time */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-800 truncate pr-2">
              {meal.name}
            </h3>
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-xs text-gray-500">{meal.time}</span>
              {meal.diabetesFriendly && (
                <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  DF
                </span>
              )}
            </div>
          </div>
          <div className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
            {meal.nutritionalInfo.calories} cal
          </div>
        </div>

        {/* Macronutrient bars - visual representation */}
        <div className="mt-3 space-y-2">
          {/* Carbs bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Carbs</span>
              <span className="text-gray-700 font-medium">
                {meal.nutritionalInfo.carbs}g
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.carbs, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Protein bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Protein</span>
              <span className="text-gray-700 font-medium">
                {meal.nutritionalInfo.protein}g
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.protein * 2, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Fat bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Fat</span>
              <span className="text-gray-700 font-medium">
                {meal.nutritionalInfo.fat}g
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{
                  width: `${Math.min(meal.nutritionalInfo.fat * 2, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Food items in the meal */}
        {meal.foods.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex-grow">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Includes:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {meal.foods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded text-xs"
                >
                  <div className="flex items-center">
                    <FoodTypeIcon
                      type={food.type}
                      className="w-4 h-4 mr-1.5 text-gray-600"
                    />
                    <span className="text-gray-800">{food.name}</span>
                  </div>{" "}
                  <span className="text-gray-500 capitalize">
                    {food.type.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health indicators */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2">
            {meal.nutritionalInfo.glycemicIndex !== undefined && (
              <div className="bg-blue-50 rounded p-1.5 text-center">
                <div className="text-xs text-gray-500">GI</div>
                <div className="text-sm font-medium text-blue-700">
                  {meal.nutritionalInfo.glycemicIndex.toFixed(1)}
                </div>
              </div>
            )}

            {meal.nutritionalInfo.glycemicLoad !== undefined && (
              <div className="bg-green-50 rounded p-1.5 text-center">
                <div className="text-xs text-gray-500">GL</div>
                <div className="text-sm font-medium text-green-700">
                  {meal.nutritionalInfo.glycemicLoad}
                </div>
              </div>
            )}

            {meal.nutritionalInfo.fiber > 0 && (
              <div className="bg-purple-50 rounded p-1.5 text-center">
                <div className="text-xs text-gray-500">Fiber</div>
                <div className="text-sm font-medium text-purple-700">
                  {meal.nutritionalInfo.fiber}g
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden box-border">
      {/* Fixed header for meal bins */}
      <div className="flex border-b bg-white z-20 sticky top-0">
        {/* Date column header */}
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700 border-r">
          Date
        </div>

        {/* Meal bin headers */}
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

      {/* Scrollable container for all displayed days */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="min-h-full flex flex-col">
          {/* *** Iterate over datesToDisplay *** */}
          {datesToDisplay.map((currentDate) => {
            const isSelected = isSameDay(
              normalizeDate(currentDate),
              normalizeDate(selectedDate)
            );
            const bins = organizeMealsIntoBins(currentDate);

            return (
              <div
                key={currentDate.toISOString()}
                className={`flex flex-1 min-h-[150px] border-b last:border-b-0  ${isSelected ? "bg-blue-50" : "bg-white"}`}
                // className={`
                //   flex flex-1 min-h-[200px] border-b last:border-b-0
                //   ${isSelected ? "bg-blue-50" : "bg-white"}
                // `} // Add min-height and highlight selected
              >
                {/* Date Cell */}
                <div
                  className={`
                    w-32 flex-shrink-0 p-4 border-r flex flex-col justify-start
                    ${isSelected ? "border-blue-200" : "border-gray-200"}
                  `}
                >
                  <div
                    className={`font-semibold ${
                      isSelected ? "text-blue-800" : "text-gray-800"
                    }`}
                  >
                    {format(currentDate, "EEE")}
                  </div>
                  <div
                    className={`text-sm ${
                      isSelected ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {format(currentDate, "MMM d")}
                  </div>
                  <div
                    className={`text-xs ${
                      isSelected ? "text-blue-500" : "text-gray-400"
                    }`}
                  >
                    {format(currentDate, "yyyy")}
                  </div>
                </div>

                {/* Meal Bins for this date */}
                <div className="flex flex-1">
                  {mealBinNames.map((binName) => {
                    const bin = bins[binName];
                    return (
                      <div
                        key={`${currentDate.toISOString()}-${binName}`}
                        className={`
                          flex-1 p-4 border-l overflow-y-auto flex flex-col
                          ${isSelected ? "border-blue-200" : "border-gray-200"}
                        `} // Adjust border color
                      >
                        {/* Meals */}
                        <AnimatePresence>
                          {bin.meals.map((meal) =>
                            renderMealCard(meal, currentDate)
                          )}
                        </AnimatePresence>
                        {/* Recommendations */}
                        <AnimatePresence>
                          {bin.recommendations.map((recommendation) => (
                            <RecommendedMealCard
                              key={`rec-${
                                recommendation.meal.id
                              }-${currentDate.toISOString()}`}
                              className="my-2 flex-shrink-0" // Adjust margin/sizing
                              recommendation={recommendation}
                              onClick={() =>
                                onRecommendationSelect(recommendation)
                              }
                              isSelected={
                                selectedRecommendation?.meal.id ===
                                recommendation.meal.id
                              }
                            />
                          ))}
                        </AnimatePresence>
                        {/* Empty State */}
                        {bin.meals.length === 0 &&
                          bin.recommendations.length === 0 && (
                            <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                              No items
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

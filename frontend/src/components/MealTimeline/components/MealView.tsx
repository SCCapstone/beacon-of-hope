import React, { useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Meal } from "../types";
import { format, isSameDay, addDays, subDays } from "date-fns";
import { RecommendedMealCard } from "./RecommendedMealCard";
import { MealRecommendation, DayRecommendations } from "../types";

interface MealViewProps {
  weekData: DayMeals[];
  recommendationData: DayRecommendations[];
  selectedDate: Date;
  onMealSelect: (meal: Meal | null) => void;
  selectedMeal: Meal | null;
  onRecommendationSelect: (recommendation: MealRecommendation | null) => void;
  selectedRecommendation: MealRecommendation | null;
  onDateChange: (date: Date) => void;
  mealBinNames: string[];
  isLoading?: boolean;
}

export const MealView: React.FC<MealViewProps> = ({
  weekData,
  recommendationData,
  selectedDate,
  onMealSelect,
  selectedMeal,
  onRecommendationSelect,
  selectedRecommendation,
  onDateChange,
  mealBinNames,
  isLoading = false,
}) => {
  const mainAreaRef = useRef<HTMLDivElement>(null);

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

  // Get adjacent dates
  const previousDate = subDays(selectedDate, 1);
  const nextDate = addDays(selectedDate, 1);

  // Get meals for a specific date
  const getMealsForDate = useCallback(
    (targetDate: Date): Meal[] => {
      const dayData = weekData.find((day) =>
        isSameDay(new Date(day.date), targetDate)
      );
      return dayData?.meals || [];
    },
    [weekData]
  );

  // Get recommendations for a specific date
  const getRecommendationsForDate = useCallback(
    (targetDate: Date): MealRecommendation[] => {
      const dayRecs = recommendationData.find((day) =>
        isSameDay(new Date(day.date), targetDate)
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

      // Create bins based on meal times
      const bins: Record<
        string,
        { meals: Meal[]; recommendations: MealRecommendation[] }
      > = {};

      // Initialize bins with empty arrays
      mealBinNames.forEach((name) => {
        bins[name] = { meals: [], recommendations: [] };
      });

      // Sort meals by time
      const sortedMeals = [...meals].sort((a, b) => {
        const timeA = a.time.split(":").map(Number);
        const timeB = b.time.split(":").map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });

      // Distribute meals into bins
      sortedMeals.forEach((meal, index) => {
        const binIndex = Math.min(index, mealBinNames.length - 1);
        bins[mealBinNames[binIndex]].meals.push(meal);
      });

      // Distribute recommendations into bins
      recommendations.forEach((rec) => {
        // Find appropriate bin based on time
        const recTime = rec.meal.time.split(":").map(Number);
        const recTimeMinutes = recTime[0] * 60 + recTime[1];

        // Find the right bin based on time ranges
        let binIndex = 0;
        for (let i = 0; i < sortedMeals.length; i++) {
          const mealTime = sortedMeals[i].time.split(":").map(Number);
          const mealTimeMinutes = mealTime[0] * 60 + mealTime[1];

          if (recTimeMinutes <= mealTimeMinutes) {
            binIndex = i;
            break;
          }
          binIndex = i + 1;
        }

        binIndex = Math.min(binIndex, mealBinNames.length - 1);
        bins[mealBinNames[binIndex]].recommendations.push(rec);
      });

      return bins;
    },
    [getMealsForDate, getRecommendationsForDate, mealBinNames]
  );

  const isMealSelected = (meal: Meal) => {
    return selectedMeal?.id === meal.id;
  };

  // Render a collapsed date row
  const renderCollapsedDateRow = (date: Date, position: "top" | "bottom") => {
    const bins = organizeMealsIntoBins(date);

    return (
      <div
        className={`
          flex h-16 cursor-pointer transition-all duration-300
          ${
            position === "top"
              ? "border-b-2 border-gray-300 bg-gray-100"
              : "border-t-2 border-gray-300 bg-gray-100"
          }
          hover:bg-gray-200 relative
        `}
        onClick={() => onDateChange(date)}
      >
        {/* Navigation indicator */}
        <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

        {/* Date cell with navigation icon */}
        <div className="w-32 flex-shrink-0 p-2 font-medium text-gray-700 flex items-center">
          <div className="mr-2">
            {position === "top" ? (
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>
          <div>
            <div className="text-sm">{format(date, "EEE, MMM d")}</div>
            <div className="text-xs text-gray-500">{format(date, "yyyy")}</div>
          </div>
        </div>

        {/* Meal bins - simplified view */}
        {mealBinNames.map((binName) => {
          const bin = bins[binName];
          const totalItems = bin.meals.length + bin.recommendations.length;

          return (
            <div
              key={`${date.toISOString()}-${binName}`}
              className="flex-1 p-2 border-l flex items-center justify-center"
            >
              {totalItems > 0 ? (
                <div className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              )}
            </div>
          );
        })}

        {/* Navigation hint text */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {position === "top" ? "Previous day" : "Next day"}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Fixed header for meal bins */}
      <div className="flex border-b bg-white z-20 sticky top-0">
        {/* Date column header */}
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700">
          Date
        </div>

        {/* Meal bin headers */}
        {mealBinNames.map((binName) => (
          <div
            key={binName}
            className="flex-1 p-4 text-center font-medium text-gray-700 border-l"
          >
            {binName}
          </div>
        ))}
      </div>

      {/* Scrollable container for all three days */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full flex flex-col">
          {/* Previous day - collapsed row */}
          <div className="flex-shrink-0">
            {renderCollapsedDateRow(previousDate, "top")}
          </div>

          {/* Main content area - current selected date */}
          <div className="flex-grow bg-white" ref={mainAreaRef}>
            <div className="h-full flex flex-col">
              {/* Date header */}
              <div className="bg-blue-50 p-4 border-b border-blue-200">
                <div className="flex items-baseline">
                  <h2 className="text-2xl font-bold text-blue-800">
                    {format(selectedDate, "EEEE")}
                  </h2>
                  <span className="ml-2 text-lg text-blue-600">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </span>
                </div>
              </div>

              {/* Meal bins for selected date */}
              <div className="flex flex-1 min-h-0">
                {/* Left sidebar with time indicators */}
                <div className="w-32 flex-shrink-0 border-r bg-gray-50 p-4"></div>

                {/* Meal bins */}
                <div className="flex flex-1">
                  {mealBinNames.map((binName) => {
                    const bins = organizeMealsIntoBins(selectedDate);
                    const bin = bins[binName];

                    return (
                      <div
                        key={`${selectedDate.toISOString()}-${binName}`}
                        className="flex-1 p-4 border-l overflow-y-auto"
                      >
                        {/* Meals in this bin */}
                        <AnimatePresence>
                          {bin.meals.map((meal) => (
                            <motion.div
                              key={`meal-${meal.id}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={`meal-card p-4 mb-4 rounded-lg cursor-pointer
                            bg-white shadow-sm hover:shadow transition-all duration-300
                            ${
                              isMealSelected(meal)
                                ? "ring-2 ring-blue-500"
                                : "border border-gray-200"
                            }`}
                              onClick={() =>
                                onMealSelect(isMealSelected(meal) ? null : meal)
                              }
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-800 truncate pr-2">
                                    {meal.name}
                                  </h3>
                                  <div className="flex items-center mt-1 space-x-2">
                                    <span className="text-xs text-gray-500">
                                      {meal.time}
                                    </span>
                                    {meal.diabetesFriendly && (
                                      <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                        DF
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {meal.nutritionalInfo.calories} cal
                                </div>
                              </div>

                              {/* Additional meal details */}
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>
                                    Carbs: {meal.nutritionalInfo.carbs}g
                                  </span>
                                  <span>
                                    Protein: {meal.nutritionalInfo.protein}g
                                  </span>
                                  <span>Fat: {meal.nutritionalInfo.fat}g</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Recommendations in this bin */}
                        <AnimatePresence>
                          {bin.recommendations.map((recommendation) => (
                            <RecommendedMealCard
                              key={`rec-${recommendation.meal.id}`}
                              className="mb-4"
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

                        {/* Empty state */}
                        {bin.meals.length === 0 &&
                          bin.recommendations.length === 0 && (
                            <div className="h-full flex items-center justify-center">
                              <div className="text-center p-6">
                                <div className="text-gray-400 mb-2">
                                  <svg
                                    className="w-12 h-12 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                </div>
                                <p className="text-sm text-gray-500">
                                  No meals planned
                                </p>
                                <button className="mt-2 px-3 py-1 text-xs text-blue-600 hover:text-blue-800">
                                  Add meal
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Next day - collapsed row */}
          <div className="flex-shrink-0 mt-auto">
            {renderCollapsedDateRow(nextDate, "bottom")}
          </div>
        </div>
      </div>
    </div>
  );
};

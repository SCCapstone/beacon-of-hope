import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Meal } from "../types";
import { format, isSameDay } from "date-fns";
import { RecommendedMealCard } from "./RecommendedMealCard";
import { MealRecommendation, DayRecommendations } from "../types";

interface MealViewProps {
  datesToDisplay: Date[];
  allData: DayMeals[];
  recommendationData: DayRecommendations[];
  selectedDate: Date;
  onMealSelect: (meal: Meal | null) => void;
  selectedMeal: Meal | null;
  onRecommendationSelect: (recommendation: MealRecommendation | null) => void;
  onAcceptRecommendationClick: (recommendation: MealRecommendation) => void;
  onRejectRecommendationClick: (recommendation: MealRecommendation) => void;
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

const TraceMealCard: React.FC<{
  meal: Meal;
  isSelected: boolean;
  onClick: () => void;
}> = ({ meal, isSelected, onClick }) => {
  const { nutritionalInfo, diabetesFriendly } = meal;
  const totalMacros =
    nutritionalInfo.carbs + nutritionalInfo.protein;
  const carbPercent =
    totalMacros > 0 ? (nutritionalInfo.carbs / totalMacros) * 100 : 0;
  const proteinPercent =
    totalMacros > 0 ? (nutritionalInfo.protein / totalMacros) * 100 : 0;

  return (
    <motion.div
      key={`meal-${meal.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`meal-card p-3 mb-3 rounded-lg cursor-pointer
        bg-white shadow-sm hover:shadow transition-all duration-300
        ${isSelected ? "ring-2 ring-blue-500" : "border border-gray-200"}
        flex flex-col min-h-[160px]`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-800 truncate pr-2">
          {meal.name}
        </h3>
        <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          {nutritionalInfo.calories} cal
        </div>
      </div>

      {/* Macro Visualization */}
      <div className="flex h-1.5 rounded-full overflow-hidden my-2">
        <div
          className="bg-blue-400"
          style={{ width: `${carbPercent}%` }}
          title={`Carbs: ${nutritionalInfo.carbs}g`}
        />
        <div
          className="bg-purple-400"
          style={{ width: `${proteinPercent}%` }}
          title={`Protein: ${nutritionalInfo.protein}g`}
        />
      </div>

      {/* Footer Indicators */}
      <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
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
          {/* Optional: Add other simple indicators if needed */}
        </div>
      </div>
    </motion.div>
  );
};

export const MealView: React.FC<MealViewProps> = ({
  datesToDisplay,
  allData,
  recommendationData,
  selectedDate,
  onMealSelect,
  selectedMeal,
  onRecommendationSelect,
  onAcceptRecommendationClick,
  onRejectRecommendationClick,
  selectedRecommendation,
  mealBinNames,
  onMealBinUpdate,
  isLoading = false,
}) => {
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

  // Get data for a specific date from allData
  const getDataForDate = useCallback(
    (targetDate: Date): DayMeals | undefined => {
      // Ensure targetDate is normalized
      const normalizedTarget = normalizeDate(targetDate);
      return allData.find((day) => {
        // Ensure day.date is treated as a Date object and normalized
        const normalizedDayDate = normalizeDate(day.date);

        // Defensive check if normalization failed (though normalizeDate has fallbacks)
        if (
          isNaN(normalizedDayDate.getTime()) ||
          isNaN(normalizedTarget.getTime())
        ) {
          console.warn(
            "Invalid date encountered during comparison in getDataForDate",
            day.date,
            targetDate
          );
          return false;
        }

        // Perform the comparison using isSameDay
        return isSameDay(normalizedDayDate, normalizedTarget);
      });
    },
    [allData] // Dependency is correct
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
        // Defer update slightly to avoid state change during render cycle if possible
        setTimeout(() => onMealBinUpdate(newBinNames), 0);
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
      <TraceMealCard
        key={`meal-${meal.id}-${date.toISOString()}`}
        meal={meal}
        isSelected={isMealSelected(meal)}
        onClick={() => onMealSelect(isMealSelected(meal) ? null : meal)}
      />
    );
  };

  if (isLoading) {
    // Loading indicator remains the same
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-500">Loading your meal data...</p>
        </div>
      </div>
    );
  }

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
          {/*  Iterate over datesToDisplay  */}
          {datesToDisplay.map((currentDate) => {
            const isSelected = isSameDay(
              normalizeDate(currentDate),
              normalizeDate(selectedDate)
            );
            const bins = organizeMealsIntoBins(currentDate);

            return (
              <div
                key={currentDate.toISOString()}
                className={`flex flex-1 min-h-[180px] border-b last:border-b-0  ${
                  // Adjusted min-height
                  isSelected ? "bg-blue-50" : "bg-white"
                }`}
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
                  {mealBinNames.map((binName, index) => {
                    const bin = bins[binName];
                    return (
                      <div
                        key={`${currentDate.toISOString()}-${binName}`}
                        className={`
                          flex-1 p-2 overflow-y-auto flex flex-col 
                          ${index > 0 ? "border-l" : ""}
                          ${isSelected ? "border-blue-200" : "border-gray-200"}
                        `}
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
                              key={`rec-${recommendation.meal.id}-${currentDate.toISOString()}`}
                              className="my-1.5 flex-shrink-0"
                              recommendation={recommendation}
                              onAccept={() => onAcceptRecommendationClick(recommendation)}
                              onReject={() => onRejectRecommendationClick(recommendation)}
                              onClick={() => onRecommendationSelect(recommendation)} // Selects for details panel
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

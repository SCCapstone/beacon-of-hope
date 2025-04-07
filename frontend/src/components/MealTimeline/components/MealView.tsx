import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Meal } from "../types";
import { format, isSameDay } from "date-fns";
import { RecommendedMealCard } from "./RecommendedMealCard";
import { MealRecommendation, DayRecommendations } from "../types";
import { FoodTypeIcon } from "./FoodTypeIcon";
import { XMarkIcon, StarIcon as StarIconSolid } from "@heroicons/react/20/solid"; // Use Solid Star
import { formatScore } from "../utils";
import { isValid as isValidDate } from "date-fns";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline"; // Use Outline Star

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
  onDeleteMealClick: (mealId: string, date: Date) => Promise<void>;
  onFavoriteMealClick: (mealId: string, date: Date) => Promise<void>;
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

interface TraceMealCardProps {
  meal: Meal;
  isSelected: boolean;
  onClick: () => void;
  onDeleteClick: () => void;
  onFavoriteClick: () => void;
}

const TraceMealCard: React.FC<TraceMealCardProps> = ({
  meal,
  isSelected,
  onClick,
  onDeleteClick,
  onFavoriteClick,
}) => {
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(meal.isFavorited || false);

  // Destructure scores from meal object
  const {
    nutritionalInfo,
    // diabetesFriendly,
    name,
    foods = [],
    varietyScore,
    coverageScore,
    constraintScore,
  } = meal;

  // Defensive check for nutritionalInfo
  const safeNutritionalInfo = nutritionalInfo || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fiber: 0,
  };

  const totalMacros =
    safeNutritionalInfo.carbs +
    safeNutritionalInfo.protein +
    safeNutritionalInfo.fiber;
  const carbPercent =
    totalMacros > 0 ? (safeNutritionalInfo.carbs / totalMacros) * 100 : 0;
  const proteinPercent =
    totalMacros > 0 ? (safeNutritionalInfo.protein / totalMacros) * 100 : 0;
  const fiberPercent =
    totalMacros > 0 ? (safeNutritionalInfo.fiber / totalMacros) * 100 : 0;

  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    onDeleteClick(); // Call the passed handler
  };

  const handleFavoriteButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavoriting) return; // Prevent double clicks

    setIsFavoriting(true);
    setOptimisticFavorite(true); // Optimistically show as favorited

    try {
      await onFavoriteClick(); // Call the handler passed from MealView
      // Success message/handling is done in the parent (MealTimelinePage)
    } catch (error) {
      console.error("Error during favorite click:", error);
      setOptimisticFavorite(false); // Revert optimistic state on error
      // Error message is shown in parent
    } finally {
      // Reset loading state after a short delay to allow visual feedback
      setTimeout(() => setIsFavoriting(false), 500);
    }
  };

  // Get unique food types from the meal
  const foodTypes = Array.from(new Set(foods.map((food) => food.type)));

  return (
    <motion.div
      key={`meal-${meal.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className={`meal-card relative p-2 rounded-lg cursor-pointer
        bg-white shadow-sm hover:shadow transition-all duration-300
        ${isSelected ? "ring-2 ring-blue-500" : "border border-gray-200"}
        ${optimisticFavorite ? 'border-yellow-400' : ''} // Add visual cue for favorite
        flex flex-col min-h-[100px]`}
      onClick={onClick}
    >
      <motion.button
        whileHover={{
          scale: 1.05,
          backgroundColor: "rgba(239, 68, 68, 0.9)", // Red hover
        }}
        whileTap={{ scale: 0.9 }}
        onClick={handleDeleteButtonClick}
        className="absolute -top-2 -left-2 p-0.5 rounded-full text-white bg-red-500 shadow-md z-20 hover:bg-red-500 transition-colors"
        title="Remove meal"
      >
        <XMarkIcon className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{
          scale: 1.1, // Slightly larger hover effect
          backgroundColor: isFavoriting ? "rgba(200, 150, 10, 0.9)" : "rgba(245, 158, 11, 0.9)", // Yellow hover
        }}
        whileTap={{ scale: 0.9 }}
        onClick={handleFavoriteButtonClick}
        disabled={isFavoriting} // Disable while processing
        className={`absolute -top-2 -right-2 p-0.5 rounded-full text-white shadow-md z-20 transition-colors
                    ${isFavoriting ? 'bg-yellow-600 animate-pulse' : 'bg-yellow-500 hover:bg-yellow-600'}
                  `}
        title={optimisticFavorite ? "Favorited Meal" : "Favorite meal"}
      >
        {isFavoriting ? (
           <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        ) : optimisticFavorite ? (
          <StarIconSolid className="w-4 h-4" /> // Show solid star if favorited
        ) : (
          <StarIconOutline className="w-4 h-4" /> // Show outline star if not
        )}
      </motion.button>

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        {name && (
          <div className="mb-2">
            <span className="text-sm font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded-full truncate pr-2">
              {name}
            </span>
          </div>
        )}
        <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          {safeNutritionalInfo.calories} cal
        </div>
      </div>

      {/* Macro Visualization with Labels */}
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-blue-900">Carbs {Math.round(carbPercent)}%</span>
        <span className="text-purple-900">
          Protein {Math.round(proteinPercent)}%
        </span>
        <span className="text-orange-900">
          Fiber {Math.round(fiberPercent)}%
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        <div
          className="bg-blue-400"
          style={{ width: `${carbPercent}%` }}
          title={`Carbs: ${safeNutritionalInfo.carbs}g`}
        />
        <div
          className="bg-purple-400"
          style={{ width: `${proteinPercent}%` }}
          title={`Protein: ${safeNutritionalInfo.protein}g`}
        />
        <div
          className="bg-orange-400"
          style={{ width: `${fiberPercent}%` }}
          title={`Fiber: ${safeNutritionalInfo.fiber}g`}
        />
      </div>

      {/* Food Type Icons */}
      {foodTypes.length > 0 && (
        <div className="flex items-center mt-1 mb-2">
          {foodTypes.map((type, index) => (
            <div key={`${type}-${index}`} className="mr-1" title={type}>
              <FoodTypeIcon type={type} className="w-4 h-4 text-gray-500" />
            </div>
          ))}
        </div>
      )}

      {/* Footer Indicators (Scores) */}
      <div className="pt-2 mt-auto flex justify-around border-t border-gray-100 text-xs text-gray-600">
        <span title="Variety Score">V: {formatScore(varietyScore)}</span>
        <span title="Coverage Score">C: {formatScore(coverageScore)}</span>
        <span title="Nutrition Score">N: {formatScore(constraintScore)}</span>
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
  onDeleteMealClick,
  onFavoriteMealClick,
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
          mealType: meal.type,
        })),
        ...sortedRecommendations.map((rec) => ({
          type: "recommendation",
          item: rec,
          time: rec.meal.time,
          mealType: rec.meal.type,
        })),
      ].sort((a, b) => {
        // Sort primarily by time
        const timeCompare = a.time.localeCompare(b.time);
        if (timeCompare !== 0) return timeCompare;

        // If same time, sort by meal type priority (Breakfast, Lunch, Dinner, Snack)
        const priorityA = mealTypePriority[a.mealType] ?? 99;
        const priorityB = mealTypePriority[b.mealType] ?? 99;
        if (priorityA !== priorityB) return priorityA - priorityB;

        // If same time and type, prioritize trace meals over recommendations
        return a.type === "meal" ? -1 : 1;
      });
      // Dynamically determine the number of bins needed based on the max items per time slot
      // Or simply use the total number of items for simplicity if one item per bin is desired
      const requiredBins = allItems.length; // One bin per item

      // Adjust mealBinNames if necessary (this part seems okay, but ensure it runs *before* distribution)
      if (requiredBins > mealBinNames.length) {
        const newNames = [...mealBinNames];
        while (newNames.length < requiredBins) {
          newNames.push(`Meal ${newNames.length + 1}`);
        }
        // Defer update slightly
        setTimeout(() => onMealBinUpdate(newNames), 0);
        // Return early or use the old names for this render cycle to avoid immediate state issues
        // For now, let's proceed with the potentially outdated mealBinNames for this render,
        // the next render will have the updated names.
      }

      // Create bins based on the current mealBinNames
      const bins: Record<
        string,
        { meals: Meal[]; recommendations: MealRecommendation[] }
      > = {};
      mealBinNames.forEach((name) => {
        bins[name] = { meals: [], recommendations: [] };
      });

      // Distribute items to bins sequentially
      allItems.forEach((item, index) => {
        // Ensure we don't try to access a bin that doesn't exist yet
        if (index < mealBinNames.length) {
          const binName = mealBinNames[index];
          if (item.type === "meal") {
            bins[binName].meals.push(item.item as Meal);
          } else {
            bins[binName].recommendations.push(item.item as MealRecommendation);
          }
        } else {
          console.warn(
            `MealView: Not enough bins (${mealBinNames.length}) to place item ${
              index + 1
            }. Item skipped.`
          );
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
    // Ensure meal.date is valid or fallback to the date passed in
    const validMealDate = meal.date instanceof Date && isValidDate(meal.date) ? meal.date : date;

    return (
      <TraceMealCard
        key={`meal-${meal.id}-${date.toISOString()}`}
        meal={meal}
        isSelected={isMealSelected(meal)}
        onClick={() => onMealSelect(isMealSelected(meal) ? null : meal)}
        onDeleteClick={() => {
            if (meal.id && validMealDate) {
                 const confirmDelete = window.confirm(`Are you sure you want to remove "${meal.name}" from your history for ${format(validMealDate, "MMM d")}?`);
                 if (confirmDelete) {
                    onDeleteMealClick(meal.id, validMealDate);
                 }
            } else {
                console.error("Cannot delete meal: Missing ID or valid date.", meal);
                alert("Error: Cannot delete this meal due to missing information.");
            }
        }}
        onFavoriteClick={() => { // <-- Call the main handler with ID and Date
            if (meal.id && validMealDate) {
                onFavoriteMealClick(meal.id, validMealDate); // Pass ID and Date
            } else {
                console.error("Cannot favorite meal: Missing ID or valid date.", meal);
                alert("Error: Cannot favorite this meal due to missing information.");
            }
        }}
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
            // Get the bins object for the current date
            const binsForDate = organizeMealsIntoBins(currentDate);

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
                    // Get the specific bin content using the name
                    const binContent = binsForDate[binName];

                    // Add a check to ensure binContent exists and has the expected structure
                    if (!binContent || !Array.isArray(binContent.meals) || !Array.isArray(binContent.recommendations)) {
                        // Handle the case where the bin might be missing or malformed (shouldn't happen with current logic, but safe)
                        console.warn(`MealView: Invalid or missing bin content for bin '${binName}' on date ${format(currentDate, 'yyyy-MM-dd')}`);
                        return (
                            <div
                                key={`${currentDate.toISOString()}-${binName}-error`}
                                className={`flex-1 p-2 ${index > 0 ? "border-l" : ""} ${isSelected ? "border-blue-200" : "border-gray-200"}`}
                            >
                                <div className="h-full flex items-center justify-center text-center text-red-500 text-xs p-2">
                                    Error
                                </div>
                            </div>
                        );
                    }

                    // Explicitly get the arrays
                    const mealsInBin = binContent.meals;
                    const recommendationsInBin = binContent.recommendations;
                    // --- END FIX ---

                    return (
                      <div
                        key={`${currentDate.toISOString()}-${binName}`}
                        className={`
                          flex-1 p-2 overflow-y-auto flex flex-col justify-center
                          ${index > 0 ? "border-l" : ""}
                          ${isSelected ? "border-blue-200" : "border-gray-200"}
                        `}
                      >
                        {/* Meals */}
                        <AnimatePresence>
                          {/* Use the explicitly defined array */}
                          {mealsInBin.map((meal) =>
                            renderMealCard(meal, currentDate)
                          )}
                        </AnimatePresence>
                        {/* Recommendations */}
                        <AnimatePresence>
                          {/* Use the explicitly defined array */}
                          {recommendationsInBin.map((recommendation) => (
                            <RecommendedMealCard
                              key={`rec-${
                                recommendation.meal.id
                              }-${currentDate.toISOString()}`}
                              className="my-1.5 flex-shrink-0"
                              recommendation={recommendation}
                              onAccept={() =>
                                onAcceptRecommendationClick(recommendation)
                              }
                              onReject={() =>
                                onRejectRecommendationClick(recommendation)
                              }
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
                        {/* Use the explicitly defined arrays */}
                        {mealsInBin.length === 0 &&
                          recommendationsInBin.length === 0 && (
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

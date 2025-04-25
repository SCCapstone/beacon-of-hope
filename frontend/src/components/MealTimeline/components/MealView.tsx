import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Meal,
  MealRecommendation,
  DayRecommendations,
} from "../types";
import {
  format,
  isSameDay,
  addDays,
  subDays,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { RecommendedMealCard } from "./RecommendedMealCard";
import { FoodTypeIcon } from "./FoodTypeIcon";
import {
  XMarkIcon,
  StarIcon as StarIconSolid,
} from "@heroicons/react/20/solid";
import { formatScore } from "../utils";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import { generateDateRange } from "../../../services/recipeService";

// Define the type for the callback to parent for fetching (matching MealCalendarViz)
type FetchRequestHandler = (payload: {
  datesToFetch: string[];
  direction: "past" | "future" | "initial" | "specific";
}) => void;

interface MealViewProps {
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
  onRequestFetch: FetchRequestHandler;
  isFetchingPast: boolean;
  isFetchingFuture: boolean;
  loadedStartDate: Date | null;
  loadedEndDate: Date | null;
  scrollToTodayTrigger: number;
}

// Helper function
const normalizeDate = (date: Date | string): Date => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn(
      "MealView normalizeDate received invalid date, returning current date:",
      date
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const normalized = new Date(dateObj);
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
  // Use meal.isFavorited directly if available, otherwise default to false
  const [optimisticFavorite, setOptimisticFavorite] = useState(
    meal.isFavorited ?? false
  );

  // Update optimistic state if the prop changes (e.g., after successful favorite)
  useEffect(() => {
    setOptimisticFavorite(meal.isFavorited ?? false);
  }, [meal.isFavorited]);

  const {
    nutritionalInfo,
    name,
    foods = [],
    varietyScore,
    coverageScore,
    constraintScore,
  } = meal;
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
  // Use new nutrient colors for percentages
  const carbPercent =
    totalMacros > 0 ? (safeNutritionalInfo.carbs / totalMacros) * 100 : 0; // Teal
  const proteinPercent =
    totalMacros > 0 ? (safeNutritionalInfo.protein / totalMacros) * 100 : 0; // Maroon
  const fiberPercent =
    totalMacros > 0 ? (safeNutritionalInfo.fiber / totalMacros) * 100 : 0; // Gold

  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick();
  };

  const handleFavoriteButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavoriting) return;
    setIsFavoriting(true);
    setOptimisticFavorite(true);
    try {
      await onFavoriteClick();
    } catch (error) {
      console.error("Error during favorite click:", error);
      setOptimisticFavorite(false);
    } finally {
      setTimeout(() => setIsFavoriting(false), 500);
    }
  };

  // Get unique food types from the meal
  const foodTypes = Array.from(new Set(foods.map((food) => food.type)));

  return (
    <motion.div
      key={`meal-${meal.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className={`meal-card relative p-3 rounded-lg cursor-pointer transition-all duration-300
        bg-white shadow-md hover:shadow-lg
        ${
          isSelected ? "ring-2 ring-[#8B4513]" : "border border-[#E0E0E0]"
        } // Primary ring, neutral border
        ${
          optimisticFavorite ? "border-[#FFC107] ring-1 ring-[#FFC107]/50" : ""
        } // Accent Yellow border/ring
        flex flex-col min-h-[120px]`} // Increased padding/min-height
      onClick={onClick}
    >
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: "#C9302C" }} // Darker Accent Red
        whileTap={{ scale: 0.9 }}
        onClick={handleDeleteButtonClick}
        className="absolute -top-2 -left-2 p-0.5 rounded-full text-white bg-[#D9534F] shadow-md z-20 transition-colors" // Accent Red
        title="Remove meal"
      >
        <XMarkIcon className="w-4 h-4" />
      </motion.button>

      <motion.button
        whileHover={{
          scale: 1.1,
          backgroundColor: isFavoriting ? "#D4AF37" : "#FFA000",
        }} // Darker Accent Yellow
        whileTap={{ scale: 0.9 }}
        onClick={handleFavoriteButtonClick}
        disabled={isFavoriting}
        className={`absolute -top-2 -right-2 p-0.5 rounded-full text-white shadow-md z-20 transition-colors
                    ${
                      isFavoriting
                        ? "bg-yellow-600 animate-pulse"
                        : "bg-[#FFC107] hover:bg-[#FFA000]"
                    }`} // Accent Yellow
        title={optimisticFavorite ? "Favorited Meal" : "Favorite meal"}
      >
        {isFavoriting ? (
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
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
          <div className="mb-1">
            <span className="text-sm font-medium px-2 py-0.5 bg-[#8FBC8F]/20 text-[#3B8E6B] rounded-full truncate pr-2">
              {" "}
              {/* Secondary color light */}
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
        <span className="text-[#1A8C8A]">Carbs {Math.round(carbPercent)}%</span>{" "}
        {/* Darker Teal */}
        <span className="text-[#6B4226]">
          Protein {Math.round(proteinPercent)}%
        </span>{" "}
        {/* Darker Maroon */}
        <span className="text-[#B8860B]">
          Fiber {Math.round(fiberPercent)}%
        </span>{" "}
        {/* Darker Gold */}
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
        {" "}
        {/* Thicker bar */}
        <div
          className="bg-[#20B2AA]"
          style={{ width: `${carbPercent}%` }}
          title={`Carbs: ${safeNutritionalInfo.carbs}g`}
        />{" "}
        {/* Nutrient Teal */}
        <div
          className="bg-[#8B4513]"
          style={{ width: `${proteinPercent}%` }}
          title={`Protein: ${safeNutritionalInfo.protein}g`}
        />{" "}
        {/* Nutrient Maroon */}
        <div
          className="bg-[#DAA520]"
          style={{ width: `${fiberPercent}%` }}
          title={`Fiber: ${safeNutritionalInfo.fiber}g`}
        />{" "}
        {/* Nutrient Gold */}
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
        <span title="Variety Score" className="text-[#20B2AA]">
          V: {formatScore(varietyScore)}
        </span>{" "}
        {/* Teal */}
        <span title="Coverage Score" className="text-[#8B4513]">
          C: {formatScore(coverageScore)}
        </span>{" "}
        {/* Maroon */}
        <span title="Nutrition Score" className="text-[#DAA520]">
          N: {formatScore(constraintScore)}
        </span>{" "}
        {/* Gold */}
      </div>
    </motion.div>
  );
};

export const MealView: React.FC<MealViewProps> = ({
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
  // Destructure infinite scroll props
  onRequestFetch,
  isFetchingPast,
  isFetchingFuture,
  loadedStartDate,
  loadedEndDate,
  scrollToTodayTrigger,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the VERTICAL scroll container
  const SCROLL_THRESHOLD = 300; // Pixels from top/bottom edge to trigger fetch
  const FETCH_RANGE_DAYS = 7; // Number of days to fetch in each direction

  // Refs for scroll adjustment
  const prevScrollHeightRef = useRef<number>(0);
  const prevLoadedStartDateRef = useRef<Date | null>(null);
  const isAdjustingScrollRef = useRef(false); // Prevent race conditions

  // Combine and sort all available dates from trace and recommendation data
  const allAvailableDates = useMemo(() => {
    const dateSet = new Set<string>();
    allData.forEach((day) => {
      const normDate = normalizeDate(day.date);
      if (isValidDate(normDate)) dateSet.add(format(normDate, "yyyy-MM-dd"));
    });
    recommendationData.forEach((day) => {
      const normDate = normalizeDate(day.date);
      if (isValidDate(normDate)) dateSet.add(format(normDate, "yyyy-MM-dd"));
    });
    // Add loaded boundaries if they exist and are not already included
    if (loadedStartDate && isValidDate(loadedStartDate))
      dateSet.add(format(loadedStartDate, "yyyy-MM-dd"));
    if (loadedEndDate && isValidDate(loadedEndDate))
      dateSet.add(format(loadedEndDate, "yyyy-MM-dd"));

    const sortedDates = Array.from(dateSet)
      .map((dateStr) => normalizeDate(dateStr))
      .filter(isValidDate) // Ensure only valid dates proceed
      .sort((a, b) => a.getTime() - b.getTime());

    console.log(
      `MealView: Calculated ${sortedDates.length} available dates to render.`
    );
    return sortedDates;
  }, [allData, recommendationData, loadedStartDate, loadedEndDate]);

  // Get data for a specific date from allData
  const getDataForDate = useCallback(
    (targetDate: Date): DayMeals | undefined => {
      const normalizedTarget = normalizeDate(targetDate);
      return allData.find((day) => {
        const normalizedDayDate = normalizeDate(day.date);
        if (
          isNaN(normalizedDayDate.getTime()) ||
          isNaN(normalizedTarget.getTime())
        ) {
          return false;
        }
        return isSameDay(normalizedDayDate, normalizedTarget);
      });
    },
    [allData]
  );

  const getMealsForDate = useCallback(
    (targetDate: Date): Meal[] => {
      const dayData = getDataForDate(targetDate);
      return dayData?.meals || [];
    },
    [getDataForDate]
  );

  const getRecommendationsForDate = useCallback(
    (targetDate: Date): MealRecommendation[] => {
      const dayRecs = recommendationData.find((day) =>
        isSameDay(normalizeDate(day.date), normalizeDate(targetDate))
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

  // Scroll handler for VERTICAL infinite loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (
      !container ||
      !loadedStartDate ||
      !loadedEndDate ||
      isAdjustingScrollRef.current
    )
      return; // Prevent scroll handling during adjustment

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearTop = scrollTop < SCROLL_THRESHOLD;
    const isNearBottom =
      scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;

    // Fetch past data
    if (isNearTop && !isFetchingPast) {
      console.log("MealView: Near top, requesting past data...");
      const fetchEndDate = subDays(loadedStartDate, 1);
      const fetchStartDate = subDays(fetchEndDate, FETCH_RANGE_DAYS - 1);
      const datesToFetch = generateDateRange(fetchStartDate, fetchEndDate);
      if (datesToFetch.length > 0) {
        // Store scroll height *before* fetch request that will cause prepend
        prevScrollHeightRef.current = container.scrollHeight;
        onRequestFetch({ datesToFetch, direction: "past" });
      }
    }

    // Fetch future data
    if (isNearBottom && !isFetchingFuture) {
      console.log("MealView: Near bottom, requesting future data...");
      const fetchStartDate = addDays(loadedEndDate, 1);
      const fetchEndDate = addDays(fetchStartDate, FETCH_RANGE_DAYS - 1);
      const datesToFetch = generateDateRange(fetchStartDate, fetchEndDate);
      if (datesToFetch.length > 0) {
        onRequestFetch({ datesToFetch, direction: "future" });
      }
    }
  }, [
    onRequestFetch,
    isFetchingPast,
    isFetchingFuture,
    loadedStartDate,
    loadedEndDate,
  ]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Effect to adjust scroll after past data loads and renders
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !loadedStartDate) return;

    const startDateChanged =
      prevLoadedStartDateRef.current?.getTime() !== loadedStartDate.getTime();

    // Check if start date changed, fetch is complete, and it's different from initial null state
    if (
      startDateChanged &&
      !isFetchingPast &&
      prevLoadedStartDateRef.current !== null
    ) {
      const currentScrollHeight = container.scrollHeight;
      const previousScrollHeight = prevScrollHeightRef.current;

      if (currentScrollHeight > previousScrollHeight) {
        const scrollOffset = currentScrollHeight - previousScrollHeight;
        // Use requestAnimationFrame to ensure adjustment happens after paint
        isAdjustingScrollRef.current = true; // Set flag before adjustment
        requestAnimationFrame(() => {
          container.scrollTop += scrollOffset;
          console.log(
            `MealView: Adjusted scroll top by ${scrollOffset} after past data load.`
          );
          // Reset flag slightly after adjustment to allow scroll events again
          setTimeout(() => {
            isAdjustingScrollRef.current = false;
          }, 50); // Small delay
        });
      }
    }

    // Update the previous start date ref for the next check
    prevLoadedStartDateRef.current = loadedStartDate;
  }, [allData, loadedStartDate, isFetchingPast]); // Depend on data, range start, and fetching state

  useEffect(() => {
    const viewName = "MealView"; // For logging
    const container = scrollContainerRef.current;

    if (container && selectedDate && isValidDate(selectedDate)) {
      const dateId = `date-row-${format(selectedDate, "yyyy-MM-dd")}`;
      const scrollTarget = CSS.escape(dateId);

      const attemptScroll = (attempt = 1) => {
        // Use rAF for each attempt to ensure it runs after paint
        requestAnimationFrame(() => {
          const element = container.querySelector(`#${scrollTarget}`);
          if (element) {
            console.log(
              `${viewName}: Scrolling to element #${scrollTarget} (Attempt ${attempt})`
            );
            element.scrollIntoView({
              behavior: "instant",
              block: "center",
              inline: "nearest",
            });
          } else {
            console.log(
              `${viewName}: Element #${scrollTarget} not found (Attempt ${attempt})`
            );
            if (attempt < 3) {
              // Retry up to 3 times
              const delay = 100 * attempt; // Increase delay slightly each time
              console.log(`${viewName}: Retrying scroll in ${delay}ms...`);
              setTimeout(() => attemptScroll(attempt + 1), delay);
            } else {
              console.log(
                `${viewName}: Max scroll retries reached for #${scrollTarget}.`
              );
            }
          }
        });
      };

      // Initial attempt
      attemptScroll();
    } else if (!container) {
      console.log(
        `${viewName}: Scroll effect skipped, container ref not available.`
      );
    } else if (!selectedDate || !isValidDate(selectedDate)) {
      console.log(
        `${viewName}: Scroll effect skipped due to invalid selectedDate.`
      );
    }
  }, [selectedDate, scrollToTodayTrigger]);

  const isMealSelected = (meal: Meal) => {
    return selectedMeal?.id === meal.id;
  };

  const renderMealCard = (meal: Meal, date: Date) => {
    // Ensure meal.date is valid or fallback to the date passed in
    const validMealDate =
      meal.date instanceof Date && isValidDate(meal.date) ? meal.date : date;

    return (
      <TraceMealCard
        key={`meal-${meal.id}-${date.toISOString()}`} // Ensure key includes date for potential duplicates across days
        meal={meal}
        isSelected={isMealSelected(meal)}
        onClick={() => onMealSelect(isMealSelected(meal) ? null : meal)}
        onDeleteClick={() => {
          if (meal.id && validMealDate) {
            const confirmDelete = window.confirm(
              `Are you sure you want to remove "${
                meal.name
              }" from your history for ${format(validMealDate, "MMM d")}?`
            );
            if (confirmDelete) {
              onDeleteMealClick(meal.id, validMealDate);
            }
          } else {
            console.error(
              "Cannot delete meal: Missing ID or valid date.",
              meal
            );
            alert("Error: Cannot delete this meal due to missing information.");
          }
        }}
        onFavoriteClick={() => {
          // <-- Call the main handler with ID and Date
          if (meal.id && validMealDate) {
            onFavoriteMealClick(meal.id, validMealDate); // Pass ID and Date
          } else {
            console.error(
              "Cannot favorite meal: Missing ID or valid date.",
              meal
            );
            alert(
              "Error: Cannot favorite this meal due to missing information."
            );
          }
        }}
      />
    );
  };

  const LoadingIndicator = ({
    position = "center",
  }: {
    position?: "center" | "top" | "bottom";
  }) => (
    <div
      className={`flex items-center justify-center p-4 ${
        position === "top"
          ? "sticky top-0 z-10 bg-gradient-to-b from-[#FFFBF5]/80 to-transparent"
          : position === "bottom"
          ? "py-4"
          : "h-full"
      }`}
    >
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B4513]"></div>{" "}
      {/* Primary color */}
    </div>
  );

  if (isLoading && allAvailableDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mb-4" />
          <p className="text-gray-500">Loading your meal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden box-border">
      {/* Fixed header */}
      <div className="flex border-b bg-[#FADFBB] z-10 sticky top-0 flex-shrink-0 border-[#D3B89F]">
        {" "}
        {/* Darker cream header, darker border */}
        <div className="w-32 flex-shrink-0 p-3 font-semibold text-[#6B4226] border-r border-[#D3B89F]">
          {" "}
          {/* Darker brown text, adjusted padding */}
          Date
        </div>
        {/* Meal bin headers */}
        {mealBinNames.map((binName, index) => (
          <div
            key={binName}
            className={`flex-1 p-3 text-center font-semibold text-[#6B4226] ${
              index > 0 ? "border-l border-[#D3B89F]" : ""
            }`}
            style={{ minWidth: "150px" }}
          >
            {" "}
            {/* Darker brown text, darker border */}
            {binName}
          </div>
        ))}
      </div>
      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-[#FFFBF5] relative"
      >
        {" "}
        {/* Base cream background */}
        {isFetchingPast && <LoadingIndicator position="top" />}
        <div className="min-w-full divide-y divide-[#E0E0E0]">
          {" "}
          {/* Lighter neutral divider */}
          {allAvailableDates.map((currentDate) => {
            const dateId = `date-row-${format(currentDate, "yyyy-MM-dd")}`;
            const isSelected = isSameDay(
              normalizeDate(currentDate),
              normalizeDate(selectedDate)
            );
            const binsForDate = organizeMealsIntoBins(currentDate);

            return (
              <div
                key={currentDate.toISOString()}
                id={dateId}
                className={`flex min-h-[180px] hover:bg-[#FEF9F0] transition-colors duration-150 ${
                  isSelected ? "bg-[#8B4513]/5" : "bg-white"
                }`}
              >
                {" "}
                {/* Light primary tint for selected, white otherwise */}
                {/* Date Cell */}
                <div
                  className={`w-32 flex-shrink-0 p-3 border-r flex flex-col justify-start ${
                    isSelected
                      ? "border-[#A0522D]/30 bg-[#8B4513]/5"
                      : "border-[#E0E0E0]"
                  }`}
                >
                  {" "}
                  {/* Primary border/bg for selected */}
                  <div
                    className={`font-semibold ${
                      isSelected ? "text-[#8B4513]" : "text-gray-800"
                    }`}
                  >
                    {format(currentDate, "EEE")}
                  </div>
                  <div
                    className={`text-sm ${
                      isSelected ? "text-[#A0522D]" : "text-gray-500"
                    }`}
                  >
                    {format(currentDate, "MMM d")}
                  </div>
                  <div
                    className={`text-xs ${
                      isSelected ? "text-[#A0522D]/80" : "text-gray-400"
                    }`}
                  >
                    {format(currentDate, "yyyy")}
                  </div>
                </div>
                {/* Meal Bins for this date (Flex container for columns) */}
                <div className="flex flex-1">
                  {mealBinNames.map((binName, index) => {
                    const binContent = binsForDate[binName];
                    if (!binContent) {
                      return (
                        <div
                          key={`${currentDate.toISOString()}-${binName}-empty`}
                          className={`flex-1 p-3 ${
                            index > 0 ? "border-l" : ""
                          } ${
                            isSelected
                              ? "border-[#A0522D]/30"
                              : "border-[#E0E0E0]"
                          }`}
                          style={{ minWidth: "150px" }}
                        ></div>
                      );
                    }
                    const mealsInBin = binContent.meals;
                    const recommendationsInBin = binContent.recommendations;
                    return (
                      <div
                        key={`${currentDate.toISOString()}-${binName}`}
                        className={`flex-1 p-3 overflow-hidden flex flex-col items-stretch justify-start space-y-2 ${
                          index > 0 ? "border-l" : ""
                        } ${
                          isSelected
                            ? "border-[#A0522D]/30"
                            : "border-[#E0E0E0]"
                        }`}
                        style={{ minWidth: "150px" }}
                      >
                        {" "}
                        {/* Adjusted padding/spacing */}
                        <AnimatePresence>
                          {mealsInBin.map((meal) =>
                            renderMealCard(meal, currentDate)
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {recommendationsInBin.map((recommendation) => (
                            <RecommendedMealCard
                              key={`rec-${
                                recommendation.meal.id
                              }-${currentDate.toISOString()}`}
                              className="flex-shrink-0"
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
                        {mealsInBin.length === 0 &&
                          recommendationsInBin.length === 0 && (
                            <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                              Add Meal
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
        {/* Future Loading Indicator */}
        {isFetchingFuture && <LoadingIndicator position="bottom" />}
      </div>
    </div>
  );
};

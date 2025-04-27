import React, { useCallback, useState, useEffect, useRef } from "react";
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
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { formatScore } from "../utils";
import {
  StarIcon as StarIconOutline,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { generateDateRange } from "../../../services/recipeService";
import { CustomModal, ModalProps } from "../../CustomModal";

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
  isExpanded: boolean;
  maxBinsAcrossAllDates: number;
  defaultBinCount: number;
  getMealsForDate: (date: Date) => Meal[];
  getRecommendationsForDate: (date: Date) => MealRecommendation[];
  organizeMealsIntoBins: (date: Date) => {
    bins: Record<
      string,
      { meals: Meal[]; recommendations: MealRecommendation[] }
    >;
    maxBinsNeeded: number;
    currentBinNames: string[];
  };
  allAvailableDates: Date[];
  setIsExpanded: (isExpanded: boolean) => void;
  showExpansionButton: boolean;
  expandButtonTooltip: string;
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
    // Optimistic UI update happens here
    setOptimisticFavorite(true); // Example: Assume success initially
    setIsFavoriting(true);
    // Trigger the handler passed from MealView, which will call the API
    onFavoriteClick();
    // Reset loading state after a delay or based on parent feedback (if implemented)
    setTimeout(() => setIsFavoriting(false), 1000); // Simple timeout for now
  };

  // Get unique food types from the meal
  const foodTypes = Array.from(new Set(foods.map((food) => food.type)));

  // Define the descriptions for the tooltips
  const scoreDescriptions = {
    variety: "Measures the variation present in the recommended items",
    coverage:
      "Measures how well the recommended items fit the requested roles (Main Course, Side, etc.)",
    nutrition:
      "Measures how well the recommended items fit the requested user preferences (dairy, meat, and nuts)",
  };

  const favoriteTooltip = optimisticFavorite
    ? "Favorited Meal"
    : "Favorite meal";

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
          isSelected ? "ring-2 ring-pink-900" : "border border-[#E0E0E0]"
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
        data-tooltip-id="global-tooltip" // <-- Add tooltip attributes
        data-tooltip-content="Remove meal"
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
        data-tooltip-id="global-tooltip"
        data-tooltip-content={favoriteTooltip}
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
          data-tooltip-id="global-tooltip"
          data-tooltip-content={`Carbs: ${safeNutritionalInfo.carbs.toFixed(
            1
          )}g`}
        />{" "}
        {/* Nutrient Teal */}
        <div
          className="bg-[#8B4513]"
          style={{ width: `${proteinPercent}%` }}
          data-tooltip-id="global-tooltip" // <-- Add tooltip attributes
          data-tooltip-content={`Protein: ${safeNutritionalInfo.protein.toFixed(
            1
          )}g`}
        />{" "}
        {/* Nutrient Maroon */}
        <div
          className="bg-[#DAA520]"
          style={{ width: `${fiberPercent}%` }}
          data-tooltip-id="global-tooltip" // <-- Add tooltip attributes
          data-tooltip-content={`Fiber: ${safeNutritionalInfo.fiber.toFixed(
            1
          )}g`}
        />{" "}
        {/* Nutrient Gold */}
      </div>

      {/* Food Type Icons */}
      {foodTypes.length > 0 && (
        <div className="flex items-center mt-1 mb-2">
          {foodTypes.map((type, index) => (
            <div
              key={`${type}-${index}`}
              className="mr-1"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={type.replace("_", " ")}
            >
              <FoodTypeIcon type={type} className="w-4 h-4 text-gray-500" />
            </div>
          ))}
        </div>
      )}

      {/* Footer Indicators (Scores) with Tooltips */}
      <div className="pt-2 mt-auto flex justify-around border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <span className="text-[#20B2AA]">V: {formatScore(varietyScore)}</span>
          <InformationCircleIcon
            className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help"
            data-tooltip-id="global-tooltip"
            data-tooltip-content={scoreDescriptions.variety}
          />
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-[#8B4513]">
            C: {formatScore(coverageScore)}
          </span>
          <InformationCircleIcon
            className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help"
            data-tooltip-id="global-tooltip"
            data-tooltip-content={scoreDescriptions.coverage}
          />
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-[#DAA520]">
            N: {formatScore(constraintScore)}
          </span>
          <InformationCircleIcon
            className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help"
            data-tooltip-id="global-tooltip"
            data-tooltip-content={scoreDescriptions.nutrition}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const MealView: React.FC<MealViewProps> = ({
  allData,
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
  isLoading = false,
  onRequestFetch,
  isFetchingPast,
  isFetchingFuture,
  loadedStartDate,
  loadedEndDate,
  scrollToTodayTrigger,
  isExpanded,
  maxBinsAcrossAllDates,
  defaultBinCount,
  organizeMealsIntoBins,
  allAvailableDates,
  setIsExpanded,
  showExpansionButton,
  expandButtonTooltip,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the combined scroll container
  const SCROLL_THRESHOLD = 300; // Pixels from top/bottom edge to trigger fetch
  const FETCH_RANGE_DAYS = 7; // Number of days to fetch in each direction

  // Refs for scroll adjustment
  const prevScrollHeightRef = useRef<number>(0);
  const prevLoadedStartDateRef = useRef<Date | null>(null);
  const isAdjustingScrollRef = useRef(false); // Prevent race conditions

  const [modalConfig, setModalConfig] = useState<ModalProps | null>(null); // State for modal

  const showModal = useCallback(
    (config: Omit<ModalProps, "isOpen" | "onClose">) => {
      setModalConfig({
        ...config,
        isOpen: true,
        onClose: () => setModalConfig(null), // Default close action
      });
    },
    []
  );

  const showConfirmModal = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      showModal({
        title,
        message,
        type: "confirm",
        confirmText:
          title.toLowerCase().includes("delete") ||
          title.toLowerCase().includes("remove")
            ? "Delete"
            : "Confirm", // Adjust confirm text
        onConfirm: () => {
          onConfirm();
          setModalConfig(null); // Close after confirm
        },
        onCancel: () => {
          // Also close on cancel
          onCancel?.();
          setModalConfig(null);
        },
      });
    },
    [showModal]
  );

  const showErrorModal = useCallback(
    (title: string, message: string) => {
      showModal({ title, message, type: "error" });
    },
    [showModal]
  );

  // When expanded, use the maximum needed across ALL dates.
  const currentVisibleBinCount = isExpanded
    ? maxBinsAcrossAllDates // Use the max across ALL dates when expanded
    : defaultBinCount; // Use the default when collapsed

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
      // console.log("MealView: Near top, requesting past data...");
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
      // console.log("MealView: Near bottom, requesting future data...");
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
          // console.log(
          //   `MealView: Adjusted scroll top by ${scrollOffset} after past data load.`
          // );
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
    // const viewName = "MealView"; // For logging
    const container = scrollContainerRef.current;

    if (container && selectedDate && isValidDate(selectedDate)) {
      const dateId = `date-row-${format(selectedDate, "yyyy-MM-dd")}`;
      const scrollTarget = CSS.escape(dateId);

      const attemptScroll = (attempt = 1) => {
        // Use rAF for each attempt to ensure it runs after paint
        requestAnimationFrame(() => {
          const element = container.querySelector(`#${scrollTarget}`);
          if (element) {
            // console.log(
            //   `${viewName}: Scrolling to element #${scrollTarget} (Attempt ${attempt})`
            // );
            element.scrollIntoView({
              behavior: "instant",
              block: "center",
              inline: "nearest",
            });
          } else if (attempt < 3) {
            const delay = 100 * attempt;
            setTimeout(() => attemptScroll(attempt + 1), delay);
          }
        });
      };

      // Initial attempt
      attemptScroll();
      // } else if (!container) {
      // console.log(
      //   `${viewName}: Scroll effect skipped, container ref not available.`
      // );
      // } else if (!selectedDate || !isValidDate(selectedDate)) {
      // console.log(
      //   `${viewName}: Scroll effect skipped due to invalid selectedDate.`
      // );
    }
  }, [selectedDate, scrollToTodayTrigger, allAvailableDates]);

  const renderMealCard = (meal: Meal, date: Date) => {
    // Ensure meal.date is valid or fallback to the date passed in
    const validMealDate =
      meal.date instanceof Date && isValidDate(meal.date) ? meal.date : date;

    const handleDelete = () => {
      if (meal.id && validMealDate) {
        // Show confirmation modal *before* calling the parent's delete handler
        showConfirmModal(
          "Confirm Deletion",
          `Are you sure you want to remove "${
            meal.name
          }" from your history for ${format(validMealDate, "MMM d")}?`,
          () => {
            // Only call the actual delete function if confirmed
            onDeleteMealClick(meal.id!, validMealDate);
          }
        );
      } else {
        console.error("Cannot delete meal: Missing ID or valid date.", meal);
        showErrorModal(
          "Deletion Error",
          "Cannot delete this meal due to missing information."
        );
      }
    };

    const handleFavorite = () => {
      if (meal.id && validMealDate) {
        // Call the parent's favorite handler directly
        // Feedback (success/error) should be handled in MealTimelinePage
        onFavoriteMealClick(meal.id, validMealDate);
      } else {
        console.error("Cannot favorite meal: Missing ID or valid date.", meal);
        showErrorModal(
          "Favorite Error",
          "Cannot favorite this meal due to missing information."
        );
      }
    };

    return (
      <TraceMealCard
        key={`meal-${meal.id}-${date.toISOString()}`}
        meal={meal}
        isSelected={selectedMeal?.id === meal.id}
        onClick={() => onMealSelect(selectedMeal?.id === meal.id ? null : meal)}
        onDeleteClick={handleDelete}
        onFavoriteClick={handleFavorite}
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
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B4513]"></div>
      {/* Primary color */}
    </div>
  );

  if (isLoading && allAvailableDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-900 mb-4" />
          <p className="text-gray-500">Loading your meal data...</p>
        </div>
      </div>
    );
  }

  // Generate the list of bin names to display in the header based on the calculated visible count
  const headerBinNames = Array.from({ length: currentVisibleBinCount }).map(
    (_, i) => mealBinNames[i] || `Meal ${i + 1}`
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden box-border">
      {/* Scroll Wrapper - Make it relative for absolute positioning of the button */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-[#FFFBF5] relative"
        style={{ scrollbarGutter: "stable" }} // Reserve space for scrollbar
      >
        {/* Inner container for content width */}
        <div className="inline-block min-w-full align-top relative">
          {" "}
          {/* Added relative positioning */}
          {/* Sticky Header */}
          <div className="flex border-b bg-[#FADFBB] z-30 sticky top-0 flex-shrink-0 border-[#D3B89F]">
            {/* Removed min-w-max */}
            {/* Date Header Cell */}
            <div className="w-32 flex-shrink-0 p-3 font-semibold text-[#6B4226] border-r border-[#D3B89F] flex items-center justify-start">
              <span>Date</span>
            </div>
            {/* Meal bin headers */}
            {headerBinNames.map((binName, index) => (
              <div
                key={binName}
                className={`flex-1 p-3 text-center font-semibold text-[#6B4226] ${
                  index > 0 ? "border-l border-[#D3B89F]" : ""
                }`}
                style={{ minWidth: "150px" }}
              >
                {binName}
              </div>
            ))}
            {/* Header Cell for Button Column (conditional) */}
            {showExpansionButton && (
              <div
                // Use the same background and border as other header cells
                className="flex-shrink-0 w-12 p-3 border-l border-[#D3B89F] bg-[#FADFBB]"
                aria-hidden="true"
              >
                {/* Empty header cell for alignment */}
              </div>
            )}
          </div>
          {isFetchingPast && <LoadingIndicator position="top" />}
          {/* Content Rows Container */}
          <div className="divide-y divide-[#E0E0E0]">
            {allAvailableDates.map((currentDate) => {
              // Use prop allAvailableDates
              const isSelected = isSameDay(
                normalizeDate(currentDate),
                normalizeDate(selectedDate)
              );
              // Organize bins for *this specific date* using the passed function
              const {
                bins: binsForDate,
                currentBinNames: currentBinNamesForDate,
              } = organizeMealsIntoBins(currentDate);

              // Use the globally calculated currentVisibleBinCount for rendering columns
              const visibleBinCountForThisDate = currentVisibleBinCount; // Use calculated count

              return (
                <div
                  key={currentDate.toISOString()}
                  id={`date-row-${format(currentDate, "yyyy-MM-dd")}`}
                  className={`flex min-h-[180px] hover:bg-[#FEF9F0] transition-colors duration-150 ${
                    isSelected ? "bg-[#8B4513]/5" : "bg-white"
                  }`} // Ensure row expands horizontally
                >
                  {/* Date Cell */}
                  <div
                    className={`w-32 flex-shrink-0 p-3 border-r flex flex-col justify-start ${
                      isSelected
                        ? "border-[#A0522D]/30 bg-[#8B4513]/5"
                        : "border-[#E0E0E0]"
                    }`}
                  >
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

                  {/* Meal Bins for this date */}
                  {Array.from({ length: visibleBinCountForThisDate }).map(
                    (_, index) => {
                      const binName = currentBinNamesForDate[index];
                      const binContent = binName ? binsForDate[binName] : null;
                      const mealsInBin = binContent?.meals || [];
                      const recommendationsInBin =
                        binContent?.recommendations || [];
                      const keyName = headerBinNames[index] || `bin-${index}`;

                      return (
                        <div
                          key={`${currentDate.toISOString()}-${keyName}`}
                          className={`flex-1 p-3 overflow-hidden flex flex-col items-stretch justify-start space-y-2 ${
                            index > 0 ? "border-l" : ""
                          } ${
                            isSelected // Apply highlight border consistently
                              ? "border-[#A0522D]/30"
                              : index > 0
                              ? "border-[#E0E0E0]"
                              : ""
                          }`}
                          style={{ minWidth: "150px" }}
                        >
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
                                {/* Empty placeholder */}
                              </div>
                            )}
                        </div>
                      );
                    }
                  )}

                  {/* Empty Column Div for Button Space (conditional) */}
                  {showExpansionButton && (
                    <div
                      // Apply consistent background and border
                      className={`flex-shrink-0 w-12 border-l border-[#E0E0E0] bg-gray-50`}
                      aria-hidden="true"
                    >
                      {/* This div is intentionally empty to create the column space */}
                    </div>
                  )}
                </div> /* End date row */
              );
            })}
          </div>
          {isFetchingFuture && <LoadingIndicator position="bottom" />}
          {/* Single Expansion Button (Positioned Absolutely near right edge) */}
          {showExpansionButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              // Position it vertically centered, slightly offset from the right edge
              className="absolute top-1/2 -translate-y-1/2 right-1 z-20 p-2 rounded-full bg-white/70 backdrop-blur-sm shadow-lg text-gray-600 hover:text-pink-900 hover:bg-pink-50/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              data-tooltip-id="global-tooltip"
              data-tooltip-content={expandButtonTooltip}
              aria-label={
                isExpanded ? "Collapse meal slots" : "Expand meal slots"
              }
            >
              {isExpanded ? (
                <ChevronLeftIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>{" "}
        {/* End Inner container */}
      </div>{" "}
      {/* End Scroll Wrapper */}
      {modalConfig && <CustomModal {...modalConfig} />}
    </div>
  );
};

import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Food,
  MealRecommendation,
  DayRecommendations,
  Meal,
} from "../types";
import {
  format,
  isSameDay,
  startOfDay,
  parseISO,
  isValid as isValidDate,
  subDays,
  addDays,
} from "date-fns";
import { FoodTypeIcon } from "./FoodTypeIcon";
import { generateDateRange } from "../../../services/recipeService";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

// Robust date normalization
const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    // console.warn(
    //   "FoodView normalizeDate received null/undefined, returning current date."
    // );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    // console.warn(
    //   "FoodView normalizeDate received invalid date, returning current date:",
    //   date
    // );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  return startOfDay(dateObj); // Use startOfDay for robust normalization
};

type FetchRequestHandler = (payload: {
  datesToFetch: string[];
  direction: "past" | "future" | "initial" | "specific";
}) => void;

// Define the type for the organizeMealsIntoBins function passed from parent
type OrganizeMealsIntoBinsFunc = (date: Date) => {
  bins: Record<
    string,
    { meals: Meal[]; recommendations: MealRecommendation[] }
  >;
  maxBinsNeeded: number;
  currentBinNames: string[];
};

interface FoodViewProps {
  allData: DayMeals[]; // Changed from datesToDisplay
  recommendationData: DayRecommendations[];
  onFoodSelect: (food: Food | null, isRecommended?: boolean) => void;
  selectedFood: Food | null;
  mealBinNames: string[];
  onMealBinUpdate: (newBinNames: string[]) => void;
  selectedRecommendation: MealRecommendation | null;
  selectedDate: Date;
  onRequestFetch: FetchRequestHandler;
  isFetchingPast: boolean;
  isFetchingFuture: boolean;
  loadedStartDate: Date | null;
  loadedEndDate: Date | null;
  scrollToTodayTrigger: number;
  organizeMealsIntoBins: OrganizeMealsIntoBinsFunc;
  allAvailableDates: Date[];
  isExpanded: boolean;
  maxBinsAcrossAllDates: number;
  defaultBinCount: number;
  setIsExpanded: (isExpanded: boolean) => void;
  showExpansionButton: boolean;
  expandButtonTooltip: string;
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
      ? { text: "<15m", color: "bg-[#5CB85C]/20 text-[#3C763D]" }
      : totalTime <= 30
      ? { text: "15-30m", color: "bg-[#FFC107]/20 text-[#8A6D3B]" }
      : { text: ">30m", color: "bg-[#D9534F]/20 text-[#A94442]" };

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
            ? "bg-[#90EE90]/20 border border-dashed border-[#5CB85C]/50" // Lighter accent green bg, accent green border
            : "bg-[#FFFBF5] shadow-sm border border-[#E0E0E0]" // Light cream bg, neutral border
        }
        ${isSelected ? "ring-2 ring-[#8B4513]" : ""}
        hover:shadow-md transition-all duration-200
        flex items-center space-x-2`}
      onClick={onClick}
    >
      {isRecommended && (
        <span
          className="absolute -top-1.5 -left-1.5 text-[9px] bg-[#5CB85C] text-white px-1.5 py-0.5 rounded-full z-10 shadow-sm"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Recommended Food"
        >
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
              className="inline-block px-1 py-0.5 bg-[#8FBC8F]/20 text-[#3B8E6B] text-[10px] rounded-full"
              data-tooltip-id="global-tooltip"
              data-tooltip-content="Diabetes Friendly"
            >
              DF
            </span>
          )}
          {totalTime > 0 && (
            <span
              className={`inline-block px-1 py-0.5 ${timeIndicator.color} text-[10px] rounded-full`}
              data-tooltip-id="global-tooltip"
              data-tooltip-content={`Prep+Cook: ${totalTime}min`}
            >
              {timeIndicator.text}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Loading indicator component
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
  </div>
);

export const FoodView: React.FC<FoodViewProps> = ({
  allData,
  recommendationData,
  onFoodSelect,
  selectedFood,
  mealBinNames,
  selectedDate,
  onRequestFetch,
  isFetchingPast,
  isFetchingFuture,
  loadedStartDate,
  loadedEndDate,
  scrollToTodayTrigger,
  organizeMealsIntoBins,
  isExpanded,
  maxBinsAcrossAllDates,
  defaultBinCount,
  setIsExpanded,
  showExpansionButton,
  expandButtonTooltip,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the combined scroll container
  const SCROLL_THRESHOLD = 300;
  const FETCH_RANGE_DAYS = 7;

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
    if (loadedStartDate && isValidDate(loadedStartDate))
      dateSet.add(format(loadedStartDate, "yyyy-MM-dd"));
    if (loadedEndDate && isValidDate(loadedEndDate))
      dateSet.add(format(loadedEndDate, "yyyy-MM-dd"));

    const sortedDates = Array.from(dateSet)
      .map((dateStr) => normalizeDate(dateStr))
      .filter(isValidDate)
      .sort((a, b) => a.getTime() - b.getTime());

    // console.log(
    //   `FoodView: Calculated ${sortedDates.length} available dates to render.`
    // );
    return sortedDates;
  }, [allData, recommendationData, loadedStartDate, loadedEndDate]);

  // Helper function to extract foods for each bin based on meal/recommendation assignments
  const extractFoodsForBins = useCallback(
    (date: Date): Record<string, Array<Food & { isRecommended: boolean }>> => {
      // 1. Get the meal/recommendation assignments for the date using the passed function
      const { bins: mealBins } = organizeMealsIntoBins(date);
      const foodBins: Record<
        string,
        Array<Food & { isRecommended: boolean }>
      > = {};

      // 2. Iterate through each bin name defined by the meal organization
      for (const binName in mealBins) {
        foodBins[binName] = [];
        const binContent = mealBins[binName];
        const foodIdsInBin = new Set<string>(); // Track food IDs *within this bin* to avoid duplicates

        // Process trace meals in the bin
        (binContent.meals || []).forEach((meal) => {
          // Add null check
          (meal.foods || []).forEach((food) => {
            // Add null check
            if (food && food.id && !foodIdsInBin.has(food.id)) {
              foodBins[binName].push({ ...food, isRecommended: false });
              foodIdsInBin.add(food.id);
            }
          });
        });

        // Process recommendations in the bin
        (binContent.recommendations || []).forEach((rec) => {
          // Add null check
          (rec.meal?.foods || []).forEach((food) => {
            // Add null check
            if (food && food.id) {
              if (!foodIdsInBin.has(food.id)) {
                // Add as recommended if not already present in this bin
                foodBins[binName].push({ ...food, isRecommended: true });
                foodIdsInBin.add(food.id);
              } else {
                // If already present (likely from a trace meal), mark it as recommended
                const existingIndex = foodBins[binName].findIndex(
                  (f) => f.id === food.id
                );
                if (existingIndex > -1) {
                  foodBins[binName][existingIndex].isRecommended = true;
                }
              }
            }
          });
        });

        // 3. Sort foods within the bin (optional, e.g., by type then name)
        foodBins[binName].sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          return a.name.localeCompare(b.name);
        });
      }

      return foodBins;
    },
    [organizeMealsIntoBins] // Depends on the passed function
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

    if (isNearTop && !isFetchingPast) {
      // console.log("FoodView: Near top, requesting past data...");
      const fetchEndDate = subDays(loadedStartDate, 1);
      const fetchStartDate = subDays(fetchEndDate, FETCH_RANGE_DAYS - 1);
      const datesToFetch = generateDateRange(fetchStartDate, fetchEndDate);
      if (datesToFetch.length > 0) {
        // Store scroll height *before* fetch request that will cause prepend
        prevScrollHeightRef.current = container.scrollHeight;
        onRequestFetch({ datesToFetch, direction: "past" });
      }
    }

    if (isNearBottom && !isFetchingFuture) {
      // console.log("FoodView: Near bottom, requesting future data...");
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
          //   `FoodView: Adjusted scroll top by ${scrollOffset} after past data load.`
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
    // const viewName = "FoodView"; // For logging
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
            // console.log(
            //   `${viewName}: Element #${scrollTarget} not found (Attempt ${attempt})`
            // );
            // Retry up to 3 times
            const delay = 100 * attempt; // Increase delay slightly each time
            // console.log(`${viewName}: Retrying scroll in ${delay}ms...`);
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
  }, [selectedDate, scrollToTodayTrigger]);

  // Determine visible bins based on expansion state
  const currentVisibleBinCount = isExpanded
    ? maxBinsAcrossAllDates
    : defaultBinCount;

  // Generate header names based on visible count
  const headerBinNames = Array.from({ length: currentVisibleBinCount }).map(
    (_, i) => mealBinNames[i] || `Meal ${i + 1}`
  );

  // console.log(
  //   `FoodView: Rendering component. Dates to render: ${
  //     allAvailableDates.length
  //   }, Bins: ${mealBinNames.join(", ")}`
  // );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden box-border">
      {/* Scroll Wrapper: Handles both vertical and horizontal scrolling */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-[#FFFBF5] relative" // Use overflow-auto for both scrolls
        style={{ scrollbarGutter: "stable" }} // Reserve space for scrollbar
      >
        {/* Inner container to enforce consistent width */}
        <div className="inline-block min-w-full align-top relative">
          {/* Sticky Header: Stays at the top *within* the scroll wrapper */}
          <div className="flex border-b bg-[#FADFBB] z-30 sticky top-0 flex-shrink-0 border-[#D3B89F]">
            {/* Date Header Cell */}
            <div className="w-32 flex-shrink-0 p-3 font-semibold text-[#6B4226] border-r border-[#D3B89F]">
              Date
            </div>
            {/* Render bin headers */}
            {headerBinNames.map((binName, index) => (
              <div
                key={binName}
                className={`flex-1 p-3 text-center font-semibold text-[#6B4226] ${
                  index > 0 ? "border-l border-[#D3B89F]" : ""
                }`}
                style={{ minWidth: "150px" }} // Ensure minimum width for bins
              >
                {binName}
              </div>
            ))}
            {/* Expansion Button Header Cell (conditional) */}
            {showExpansionButton && (
              <div
                className="flex-shrink-0 w-12 p-3 border-l border-[#D3B89F] bg-[#FADFBB]" // Consistent header style
                aria-hidden="true"
              >
                {/* Empty header cell */}
              </div>
            )}
          </div>
          {/* Past Loading Indicator */}
          {isFetchingPast && <LoadingIndicator position="top" />}
          {/* Content Rows Container: No longer needs min-w-full */}
          <div className="divide-y divide-[#E0E0E0]">
            {allAvailableDates.map((currentDate) => {
              const dateId = `date-row-${format(currentDate, "yyyy-MM-dd")}`;
              if (!isValidDate(currentDate)) {
                console.error(
                  "FoodView: Invalid date object encountered in allAvailableDates",
                  currentDate
                );
                return null;
              }
              const isSelectedHighlight = isSameDay(
                normalizeDate(currentDate),
                normalizeDate(selectedDate)
              );
              const foodsByBin = extractFoodsForBins(currentDate);
              const visibleBinCountForThisDate = currentVisibleBinCount;

              return (
                <div
                  key={currentDate.toISOString()}
                  id={dateId}
                  className={`flex min-h-[150px] hover:bg-[#FEF9F0] transition-colors duration-150 ${
                    isSelectedHighlight ? "bg-[#8B4513]/5" : "bg-white"
                  } `}
                >
                  {/* Date Cell */}
                  <div
                    className={`w-32 flex-shrink-0 p-3 border-r flex flex-col justify-start ${
                      // Adjusted padding
                      isSelectedHighlight
                        ? "border-[#A0522D]/30 bg-[#8B4513]/5"
                        : "border-[#E0E0E0]"
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        isSelectedHighlight ? "text-[#8B4513]" : "text-gray-800" // Primary text color for selected
                      }`}
                    >
                      {format(currentDate, "EEE")}
                    </div>
                    <div
                      className={`text-sm ${
                        isSelectedHighlight ? "text-[#A0522D]" : "text-gray-500" // Slightly lighter primary text
                      }`}
                    >
                      {format(currentDate, "MMM d")}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelectedHighlight
                          ? "text-[#A0522D]/80"
                          : "text-gray-400" // Lighter primary text
                      }`}
                    >
                      {format(currentDate, "yyyy")}
                    </div>
                  </div>

                  {/* Food Bins */}
                  {Array.from({ length: visibleBinCountForThisDate }).map(
                    (_, index) => {
                      // Get the correct bin name for this column index
                      const binName = headerBinNames[index];
                      // Get the food content for this specific bin name
                      const binContent = foodsByBin[binName] || [];
                      const keyName = binName || `bin-${index}`;

                      return (
                        <div
                          key={`${currentDate.toISOString()}-${keyName}`}
                          className={`flex-1 p-3 w-full flex flex-col items-stretch justify-start overflow-y-auto ${
                            index > 0 ? "border-l" : ""
                          } ${
                            isSelectedHighlight // Apply highlight border consistently
                              ? "border-[#A0522D]/30" // Highlighted border
                              : index > 0
                              ? "border-[#E0E0E0]" // Normal border
                              : ""
                          }`}
                          style={{ minWidth: "150px" }} // Ensure min width for bins
                        >
                          <AnimatePresence>
                            {binContent?.map((food) => (
                              <FoodCard
                                key={`${food.id}-${food.isRecommended}`}
                                food={food}
                                isSelected={selectedFood?.id === food.id}
                                isRecommended={food.isRecommended}
                                onClick={() => {
                                  onFoodSelect(
                                    selectedFood?.id === food.id ? null : food,
                                    food.isRecommended
                                  );
                                }}
                              />
                            ))}
                          </AnimatePresence>
                          {(!binContent || binContent.length === 0) && (
                            <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                              ·
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}

                  {/* Empty Column Div for Button Space (conditional) */}
                  {showExpansionButton && (
                    <div
                      className={`flex-shrink-0 w-12 border-l border-[#E0E0E0] bg-gray-50`} // Consistent background
                      aria-hidden="true"
                    >
                      {/* Empty div */}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {isFetchingFuture && <LoadingIndicator position="bottom" />}
          {/* Single Expansion Button */}
          {showExpansionButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
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
        </div>
        {/* End Inner container */}
      </div>
      {/* End Scroll Wrapper */}
    </div>
  );
};

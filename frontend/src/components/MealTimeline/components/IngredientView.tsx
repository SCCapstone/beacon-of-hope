import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
  DayRecommendations,
  COLOR_SCHEMES,
} from "../types";
import {
  format,
  isSameDay,
  startOfDay,
  isValid as isValidDate,
  parseISO,
  subDays,
  addDays,
} from "date-fns";
import { generateDateRange } from "../../../services/recipeService";

// Robust date normalization
const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    console.warn(
      "IngredientView normalizeDate received null/undefined, returning current date."
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn(
      "IngredientView normalizeDate received invalid date, returning current date:",
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

// Define the type for the callback to parent for fetching
type FetchRequestHandler = (payload: {
  datesToFetch: string[];
  direction: "past" | "future" | "initial" | "specific";
}) => void;

interface IngredientViewProps {
  allData: DayMeals[];
  recommendationData: DayRecommendations[];
  onIngredientSelect: (
    ingredient: Ingredient | null,
    isRecommended?: boolean
  ) => void;
  selectedIngredient: Ingredient | null;
  mealBinNames: string[]; // Keep prop for potential future use (though categories are used now)
  onMealBinUpdate: (newBinNames: string[]) => void; // Keep prop
  selectedRecommendation: MealRecommendation | null; // For context/highlighting
  selectedDate: Date; // The currently selected date from the parent
  // Add infinite scroll props
  onRequestFetch: FetchRequestHandler;
  isFetchingPast: boolean;
  isFetchingFuture: boolean;
  loadedStartDate: Date | null;
  loadedEndDate: Date | null;
  scrollToTodayTrigger: number;
}

const getPrimaryNutrient = (
  nutritionalInfo: NutritionalInfo | undefined
): string | null => {
  if (!nutritionalInfo) return null;
  const { protein = 0, carbs = 0, fiber = 0 } = nutritionalInfo;
  if (fiber > 3) return "Fiber Source";
  const macros = { protein, carbs };
  let primary: keyof typeof macros | null = null;
  let maxValue = 0;

  for (const key in macros) {
    if (macros[key as keyof typeof macros] > maxValue) {
      maxValue = macros[key as keyof typeof macros];
      primary = key as keyof typeof macros;
    }
  }
  if (primary && maxValue > 5) {
    return `${primary.charAt(0).toUpperCase() + primary.slice(1)} Source`;
  }
  return null;
};

const IngredientCard: React.FC<{
  ingredient: Ingredient;
  isSelected: boolean;
  isRecommended: boolean;
  onClick: () => void;
}> = ({ ingredient, isSelected, isRecommended, onClick }) => {
  const categoryColor =
    COLOR_SCHEMES.ingredient[
      ingredient.category as keyof typeof COLOR_SCHEMES.ingredient
    ] || "#cccccc";
  const primaryNutrient = getPrimaryNutrient(ingredient.nutritionalInfo);

  // Use ingredient.id directly for the key, assuming it's unique
  const uniqueKey = ingredient.id || `${ingredient.name}-${Math.random()}`;

  return (
    <motion.div
      key={`ingredient-${uniqueKey}-${isRecommended}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`ingredient-card-item relative p-1.5 rounded-md cursor-pointer text-xs flex items-center space-x-1.5 transition-colors duration-150 w-auto
        ${
          isRecommended
            ? "bg-[#90EE90]/20 border border-dashed border-[#5CB85C]/40" // Lighter accent green bg, accent green border
            : "bg-[#FEF9F0] hover:bg-[#FADFBB]/30 border border-transparent" // Lighter cream bg, subtle hover
        }
        ${
          isSelected ? "ring-1 ring-[#DAA520] bg-[#FFFBF5]" : ""
        } // Accent gold ring, light cream bg
      `}
      onClick={onClick}
    >
      {isRecommended && (
        <span className="absolute -top-1 -left-1 text-[8px] bg-[#5CB85C] text-white px-1 py-0.5 rounded-full z-10 shadow-sm">
          Rec
        </span>
      )}
      {/* Category Color Bar */}
      <div
        className="w-1.5 h-5 rounded-sm flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
        title={`Category: ${ingredient.category}`}
      ></div>
      {/* Ingredient Name and Amount (will grow) */}
      <div className="flex-grow overflow-hidden">
        <h5 className="font-medium text-gray-800 truncate">
          {ingredient.name}
        </h5>
        <p className="text-gray-500">
          {ingredient.amount} {ingredient.unit}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        {primaryNutrient && (
          <span className="inline-block px-1 py-0.5 bg-[#8B4513]/15 text-[#6B4226] text-[9px] rounded-full">
            {/* Primary color light */}
            {primaryNutrient}
          </span>
        )}
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
        ? "sticky top-0 z-10 bg-gradient-to-b from-[#FFFBF5]/80 to-transparent" // Use base background
        : position === "bottom"
        ? "py-4"
        : "h-full"
    }`}
  >
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-900"></div>{" "}
    {/* Primary color */}
  </div>
);

export const IngredientView: React.FC<IngredientViewProps> = ({
  allData,
  recommendationData,
  onIngredientSelect,
  selectedIngredient,
  selectedDate,
  onRequestFetch,
  isFetchingPast,
  isFetchingFuture,
  loadedStartDate,
  loadedEndDate,
  scrollToTodayTrigger,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the combined scroll container
  const SCROLL_THRESHOLD = 300;
  const FETCH_RANGE_DAYS = 7;

  // Refs for scroll adjustment
  const prevScrollHeightRef = useRef<number>(0);
  const prevLoadedStartDateRef = useRef<Date | null>(null);
  const isAdjustingScrollRef = useRef(false); // Prevent race conditions

  // Combine and sort all available dates
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
    //   `IngredientView: Calculated ${sortedDates.length} available dates to render.`
    // );
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

  // Get combined ingredients for a specific date
  const getCombinedIngredientsForDate = useCallback(
    (targetDate: Date): Array<Ingredient & { isRecommended: boolean }> => {
      const normalizedTargetDate = normalizeDate(targetDate);
      if (!isValidDate(normalizedTargetDate)) return [];

      const combinedIngredientMap = new Map<
        string, // Use the ingredient's unique ID as the key
        Ingredient & { isRecommended: boolean }
      >();

      // Process Trace Ingredients
      const dayData = getDataForDate(normalizedTargetDate);
      if (dayData) {
        (dayData.meals || []).forEach((meal) => {
          (meal.foods || []).forEach((food) => {
            (food.ingredients || []).forEach((ingredient) => {
              // Use ingredient.id directly - assuming it's unique from transformation
              if (ingredient.id && !combinedIngredientMap.has(ingredient.id)) {
                combinedIngredientMap.set(ingredient.id, {
                  ...ingredient,
                  isRecommended: false,
                });
              } else if (!ingredient.id) {
                console.warn("Trace ingredient missing ID:", ingredient);
              }
            });
          });
        });
      }

      // Process Recommended Ingredients
      const dayRecommendations = recommendationData.find((dayRec) =>
        isSameNormalizedDay(dayRec.date, normalizedTargetDate)
      );
      if (dayRecommendations) {
        (dayRecommendations.recommendations || []).forEach((rec) => {
          (rec.meal.foods || []).forEach((food) => {
            (food.ingredients || []).forEach((ing) => {
              if (ing.id) {
                if (combinedIngredientMap.has(ing.id)) {
                  const existing = combinedIngredientMap.get(ing.id)!;
                  combinedIngredientMap.set(ing.id, {
                    ...existing, // Keep original ingredient data
                    isRecommended: true, // Mark as recommended
                  });
                } else {
                  combinedIngredientMap.set(ing.id, {
                    ...ing,
                    isRecommended: true,
                  });
                }
              } else if (!ing.id) {
                console.warn("Recommended ingredient missing ID:", ing);
              }
            });
          });
        });
      }

      const combinedIngredients = Array.from(combinedIngredientMap.values());
      combinedIngredients.sort((a, b) => {
        if (a.category !== b.category)
          return (a.category || "z").localeCompare(b.category || "z");
        return a.name.localeCompare(b.name);
      });

      return combinedIngredients;
    },
    [getDataForDate, recommendationData]
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
      // console.log("IngredientView: Near top, requesting past data...");
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
      // console.log("IngredientView: Near bottom, requesting future data...");
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
        isAdjustingScrollRef.current = true;
        requestAnimationFrame(() => {
          container.scrollTop += scrollOffset;
          setTimeout(() => {
            isAdjustingScrollRef.current = false;
          }, 50);
        });
      }
    }
    prevLoadedStartDateRef.current = loadedStartDate;
  }, [allData, loadedStartDate, isFetchingPast]);

  useEffect(() => {
    // const viewName = "IngredientView"; // For logging
    const container = scrollContainerRef.current;

    if (container && selectedDate && isValidDate(selectedDate)) {
      const dateId = `date-row-${format(selectedDate, "yyyy-MM-dd")}`;
      const scrollTarget = CSS.escape(dateId);

      const attemptScroll = (attempt = 1) => {
        requestAnimationFrame(() => {
          const element = container.querySelector(`#${scrollTarget}`);
          if (element) {
            // console.log(
            //   `${viewName}: Scrolling to element #${scrollTarget} (Attempt ${attempt})`
            // );
            element.scrollIntoView({
              behavior: "instant",
              block: "start",
              inline: "nearest",
            });
          } else if (attempt < 3) {
            // Retry up to 3 times
            const delay = 100 * attempt; // Increase delay slightly each time
            // console.log(`${viewName}: Retrying scroll in ${delay}ms...`);
            setTimeout(() => attemptScroll(attempt + 1), delay);
          }
        });
      };

      // Initial attempt
      attemptScroll();
    } else if (!container) {
      // console.log(
      //   `${viewName}: Scroll effect skipped, container ref not available.`
      // );
    } else if (!selectedDate || !isValidDate(selectedDate)) {
      // console.log(
      //   `${viewName}: Scroll effect skipped due to invalid selectedDate.`
      // );
    }
  }, [selectedDate, scrollToTodayTrigger, allAvailableDates]);

  // console.log(
  //   `IngredientView: Rendering component. Dates to render: ${allAvailableDates.length}`
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
        <div className="inline-block min-w-full align-top">
          {" "}
          {/* NEW WRAPPER */}
          {/* Sticky Header: Stays at the top *within* the scroll wrapper */}
          <div className="flex border-b bg-[#FADFBB] z-30 sticky top-0 flex-shrink-0 border-[#D3B89F]">
            {" "}
            {/* Removed min-w-max */}
            <div className="w-32 flex-shrink-0 p-3 font-semibold text-[#6B4226] border-r border-[#D3B89F]">
              Date
            </div>
            {/* Header for the ingredients area */}
            <div className="flex-1 p-3 text-left font-semibold text-[#6B4226]">
              Ingredients
            </div>
          </div>
          {/* Past Loading Indicator */}
          {isFetchingPast && <LoadingIndicator position="top" />}
          {/* Content Rows Container */}
          <div className="divide-y divide-[#E0E0E0]">
            {allAvailableDates.map((currentDate) => {
              const dateId = `date-row-${format(currentDate, "yyyy-MM-dd")}`;
              if (!isValidDate(currentDate)) {
                console.error(
                  "IngredientView: Invalid date object encountered in allAvailableDates",
                  currentDate
                );
                return null;
              }
              // Use the same variable name as MealView for clarity
              const isSelected = isSameDay(
                normalizeDate(currentDate),
                normalizeDate(selectedDate)
              );
              // Get the combined list of ingredients for this date
              const combinedIngredients =
                getCombinedIngredientsForDate(currentDate);
              const totalIngredients = combinedIngredients.length;

              return (
                // Use flex-row for the main layout
                <div
                  key={currentDate.toISOString()}
                  id={dateId}
                  className={`flex min-h-[60px] hover:bg-[#FEF9F0] transition-colors duration-150 ${
                    isSelected ? "bg-pink-900/5" : "bg-white"
                  }`}
                >
                  {/* Cell 1: Date Information */}
                  <div
                    // Apply consistent cell styling from MealView
                    className={`w-32 flex-shrink-0 p-3 border-r flex flex-col justify-start ${
                      isSelected
                        ? "border-[#A0522D]/30 bg-[#8B4513]/5"
                        : "border-[#E0E0E0]"
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        isSelected ? "text-pink-900" : "text-gray-800"
                      }`}
                    >
                      {format(currentDate, "EEE")}
                    </div>
                    <div
                      // Apply consistent text styling from MealView
                      className={`text-sm ${
                        isSelected ? "text-[#A0522D]" : "text-gray-500"
                      }`}
                    >
                      {format(currentDate, "MMM d")}
                    </div>
                    <div
                      // Apply consistent text styling from MealView
                      className={`text-xs ${
                        isSelected ? "text-[#A0522D]/80" : "text-gray-400"
                      }`}
                    >
                      {format(currentDate, "yyyy")}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ({totalIngredients} ingredient
                      {totalIngredients !== 1 ? "s" : ""})
                    </div>
                  </div>
                  <div className="flex-1 p-1.5 flex flex-wrap gap-1.5 items-start content-start">
                    <AnimatePresence>
                      {combinedIngredients.map((ingredient) => {
                        // *** Use direct ID comparison ***
                        const isCurrentlySelected =
                          selectedIngredient?.id === ingredient.id;
                        return (
                          <IngredientCard
                            // Use ingredient.id for the key
                            key={`${ingredient.id}-${ingredient.isRecommended}`}
                            ingredient={ingredient}
                            isSelected={isCurrentlySelected}
                            isRecommended={ingredient.isRecommended}
                            onClick={() => {
                              // Toggle based on direct ID comparison
                              onIngredientSelect(
                                isCurrentlySelected ? null : ingredient,
                                ingredient.isRecommended
                              );
                            }}
                          />
                        );
                      })}
                    </AnimatePresence>
                    {/* Show message if no ingredients */}
                    {totalIngredients === 0 && (
                      <div className="flex items-center justify-center text-center text-gray-400 text-xs p-2 w-full h-full min-h-[40px]">
                        .
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>{" "}
          {/* End Content Rows Container */}
          {/* Future Loading Indicator */}
          {isFetchingFuture && <LoadingIndicator position="bottom" />}
        </div>{" "}
        {/* End Inner container */}
      </div>{" "}
      {/* End Scroll Wrapper */}
    </div>
  );
};

import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
  DayRecommendations,
  COLOR_SCHEMES,
  Meal,
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
    // console.warn(
    //   "IngredientView normalizeDate received null/undefined, returning current date."
    // );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    // console.warn(
    //   "IngredientView normalizeDate received invalid date, returning current date:",
    //   date
    // );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  return startOfDay(dateObj); // Use startOfDay for robust normalization
};

// Define the type for the callback to parent for fetching
type FetchRequestHandler = (payload: {
  datesToFetch: string[];
  direction: "past" | "future" | "initial" | "specific";
}) => void;

type OrganizeMealsIntoBinsFunc = (date: Date) => {
  bins: Record<
    string,
    { meals: Meal[]; recommendations: MealRecommendation[] } // Ensure Meal type is used here
  >;
  maxBinsNeeded: number;
  currentBinNames: string[];
};

interface IngredientViewProps {
  allData: DayMeals[];
  recommendationData: DayRecommendations[];
  onIngredientSelect: (
    ingredient: Ingredient | null,
    isRecommended?: boolean
  ) => void;
  selectedIngredient: Ingredient | null;
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
  isExpanded: boolean;
  maxBinsAcrossAllDates: number;
  defaultBinCount: number;
}

const getPrimaryNutrient = (
  nutritionalInfo: NutritionalInfo | undefined
): string | null => {
  if (!nutritionalInfo) return null;
  const { protein = 0, carbs = 0, fiber = 0 } = nutritionalInfo;
  if (fiber > 3) return "Fiber"; // Simplified name
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
    // Simplified name
    return `${primary.charAt(0).toUpperCase() + primary.slice(1)}`;
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
    ] || "#A0AEC0";
  const primaryNutrient = getPrimaryNutrient(ingredient.nutritionalInfo);
  const uniqueKey = ingredient.id || `${ingredient.name}-${Math.random()}`;
  const cardTooltip = `${ingredient.name} (${ingredient.amount} ${ingredient.unit}) - Category: ${ingredient.category}`;

  return (
    <motion.div
      key={`ingredient-${uniqueKey}-${isRecommended}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      className={`ingredient-card-item relative p-1.5 rounded cursor-pointer text-xs flex items-center space-x-1.5 transition-all duration-150 w-auto shadow-sm hover:shadow-md
        ${
          isRecommended
            ? "bg-emerald-50 border border-dashed border-emerald-400/60" // Lighter green bg, slightly stronger dashed border
            : "bg-white border border-gray-200/80 hover:bg-gray-50" // White bg, subtle border, light gray hover
        }
        ${
          isSelected
            ? "ring-2 ring-offset-1 ring-pink-900 bg-[#FFF8DC] border-transparent" // Gold ring with offset, light yellow bg
            : ""
        }
      `}
      onClick={onClick}
      data-tooltip-id="global-tooltip"
      data-tooltip-content={cardTooltip}
    >
      {/* Recommendation Badge */}
      {isRecommended && (
        <span
          className="absolute -top-1.5 -left-1.5 text-[8px] bg-emerald-500 text-white px-1 py-0.5 rounded-full z-10 shadow"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Recommended Ingredient"
        >
          REC
        </span>
      )}
      {/* Category Color Bar */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
        data-tooltip-id="global-tooltip"
        data-tooltip-content={`Category: ${ingredient.category}`}
      ></div>

      {/* Ingredient Name and Amount */}
      <div className="flex-grow overflow-hidden min-w-0">
        {" "}
        {/* Added min-w-0 for better truncation */}
        <h5 className="font-medium text-gray-800 truncate leading-tight">
          {ingredient.name}
        </h5>
        <p className="text-gray-500 text-[10px] leading-tight">
          {ingredient.amount} {ingredient.unit}
        </p>
      </div>

      {/* Primary Nutrient Badge (if applicable) */}
      {primaryNutrient && (
        <div className="flex-shrink-0 ml-auto pl-1">
          {/* Ensure it doesn't wrap */}
          <span
            className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-medium rounded-full whitespace-nowrap"
            data-tooltip-id="global-tooltip"
            data-tooltip-content={`Primary Nutrient: ${primaryNutrient}`}
          >
            {primaryNutrient}
          </span>
        </div>
      )}
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
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-900"></div>
  </div>
);

export const IngredientView: React.FC<IngredientViewProps> = ({
  allData,
  recommendationData,
  onIngredientSelect,
  selectedIngredient,
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

  const extractIngredientsForBins = useCallback(
    (
      date: Date
    ): Record<string, Array<Ingredient & { isRecommended: boolean }>> => {
      // 1. Get the meal/recommendation assignments for the date using the passed function
      const { bins: mealBins } = organizeMealsIntoBins(date);
      const ingredientBins: Record<
        string,
        Array<Ingredient & { isRecommended: boolean }>
      > = {};

      // 2. Iterate through each bin name defined by the meal organization
      for (const binName in mealBins) {
        // Use a Map within each bin to handle duplicates and track recommendation status
        const ingredientMapInBin = new Map<
          string,
          Ingredient & { isRecommended: boolean }
        >();
        const binContent = mealBins[binName];

        // Process trace meals in the bin
        (binContent.meals || []).forEach((meal) => {
          (meal.foods || []).forEach((food) => {
            (food.ingredients || []).forEach((ingredient) => {
              if (ingredient.id && !ingredientMapInBin.has(ingredient.id)) {
                ingredientMapInBin.set(ingredient.id, {
                  ...ingredient,
                  isRecommended: false, // Initially not recommended if from trace
                });
              } else if (!ingredient.id) {
                console.warn("Trace ingredient missing ID:", ingredient);
              }
            });
          });
        });

        // Process recommendations in the bin
        (binContent.recommendations || []).forEach((rec) => {
          (rec.meal?.foods || []).forEach((food) => {
            (food.ingredients || []).forEach((ing) => {
              if (ing.id) {
                if (ingredientMapInBin.has(ing.id)) {
                  // If already present (from trace), mark it as recommended
                  const existing = ingredientMapInBin.get(ing.id)!;
                  ingredientMapInBin.set(ing.id, {
                    ...existing,
                    isRecommended: true,
                  });
                } else {
                  // Add as recommended if not already present
                  ingredientMapInBin.set(ing.id, {
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

        // Convert map values to array and sort
        const ingredientsArray = Array.from(ingredientMapInBin.values());
        ingredientsArray.sort((a, b) => {
          if (a.category !== b.category)
            return (a.category || "z").localeCompare(b.category || "z");
          return a.name.localeCompare(b.name);
        });
        ingredientBins[binName] = ingredientsArray;
      }

      return ingredientBins;
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

  // Determine visible bins based on expansion state
  const currentVisibleBinCount = isExpanded
    ? maxBinsAcrossAllDates
    : defaultBinCount;

  // Generate header names based on visible count
  const headerBinNames = Array.from({ length: currentVisibleBinCount }).map(
    (_, i) => mealBinNames[i] || `Meal Slot ${i + 1}`
  );

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
          {/* Sticky Header: Stays at the top *within* the scroll wrapper */}
          <div className="flex border-b bg-[#FADFBB] z-30 sticky top-0 flex-shrink-0 border-[#D3B89F]">
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
              const isSelectedHighlight = isSameDay(
                normalizeDate(currentDate),
                normalizeDate(selectedDate)
              );
              // Get the ingredient assignments for this date using the new helper
              const ingredientsByBin = extractIngredientsForBins(currentDate);

              return (
                // Use flex-row for the main layout
                <div
                  key={currentDate.toISOString()}
                  id={dateId}
                  className={`flex min-h-[60px] hover:bg-[#FEF9F0] transition-colors duration-150 ${
                    isSelectedHighlight ? "bg-[#8B4513]/5" : "bg-white" // Use primary color highlight
                  }`}
                >
                  {/* Cell 1: Date Information */}
                  <div
                    // Apply consistent cell styling from MealView
                    className={`w-32 flex-shrink-0 p-3 border-r flex flex-col justify-start ${
                      isSelectedHighlight
                        ? "border-[#A0522D]/30 bg-[#8B4513]/5" // Primary highlight border/bg
                        : "border-[#E0E0E0]"
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        isSelectedHighlight ? "text-[#8B4513]" : "text-gray-800" // Primary text color
                      }`}
                    >
                      {format(currentDate, "EEE")}
                    </div>
                    <div
                      className={`text-sm ${
                        isSelectedHighlight ? "text-[#A0522D]" : "text-gray-500" // Lighter primary text
                      }`}
                    >
                      {format(currentDate, "MMM d")}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelectedHighlight
                          ? "text-[#A0522D]/80"
                          : "text-gray-400" // Even lighter primary text
                      }`}
                    >
                      {format(currentDate, "yyyy")}
                    </div>
                  </div>

                  {/* Ingredient Bins */}
                  {Array.from({ length: currentVisibleBinCount }).map(
                    (_, index) => {
                      // Get the correct bin name for this column index
                      const binName = headerBinNames[index];
                      // Get the ingredient content for this specific bin name
                      const binContent = ingredientsByBin[binName] || [];
                      const keyName = binName || `bin-${index}`;
                      const totalIngredientsInBin = binContent.length;

                      return (
                        <div
                          key={`${currentDate.toISOString()}-${keyName}`}
                          className={`flex-1 p-2 flex flex-wrap gap-1.5 items-start content-start ${
                            // Use flex-wrap and gap
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
                            {binContent.map((ingredient) => {
                              const isCurrentlySelected =
                                selectedIngredient?.id === ingredient.id;
                              return (
                                <IngredientCard
                                  key={`${ingredient.id}-${ingredient.isRecommended}`}
                                  ingredient={ingredient}
                                  isSelected={isCurrentlySelected}
                                  isRecommended={ingredient.isRecommended}
                                  onClick={() => {
                                    onIngredientSelect(
                                      isCurrentlySelected ? null : ingredient,
                                      ingredient.isRecommended
                                    );
                                  }}
                                />
                              );
                            })}
                          </AnimatePresence>
                          {/* Show message if no ingredients in this bin */}
                          {totalIngredientsInBin === 0 && (
                            <div className="flex items-center justify-center text-center text-gray-400 text-xs p-2 w-full h-full min-h-[40px]">
                              ·
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div> // End date row
              );
            })}
          </div>
          {/* End Content Rows Container */}
          {/* Future Loading Indicator */}
          {isFetchingFuture && <LoadingIndicator position="bottom" />}
        </div>
        {/* End Inner container */}
      </div>
      {/* End Scroll Wrapper */}
    </div>
  );
};

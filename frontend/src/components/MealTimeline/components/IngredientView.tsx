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

// Helper to get a unique key for an ingredient
const getIngredientKey = (ingredient: Ingredient): string | null => {
  if (ingredient.id) return ingredient.id;
  if (ingredient.name) return ingredient.name.toLowerCase().trim();
  console.warn("Ingredient missing both id and name:", ingredient);
  return null; // Cannot generate a reliable key
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
  scrollToDate: Date | null;
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
  // Defensive check for nutritionalInfo
  const calories = ingredient.nutritionalInfo?.calories ?? 0;

  return (
    <motion.div
      key={`ingredient-${getIngredientKey(ingredient)}-${isRecommended}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`ingredient-card-item relative p-1.5 mb-1.5 rounded cursor-pointer text-xs flex items-center space-x-2
        ${
          isRecommended
            ? "bg-green-50/50 border border-dashed border-green-200"
            : "bg-gray-50 border border-transparent hover:bg-gray-100"
        }
        ${isSelected ? "ring-1 ring-orange-400 bg-white" : ""}
      `}
      onClick={onClick}
    >
      {isRecommended && (
        <span className="absolute -top-1 -left-1 text-[8px] bg-green-500 text-white px-1 py-0.5 rounded-full z-10 shadow-sm">
          Rec
        </span>
      )}
      <div
        className="w-1.5 h-5 rounded-sm flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
        title={`Category: ${ingredient.category}`}
      ></div>
      <div className="flex-grow overflow-hidden">
        <h5 className="font-medium text-gray-800 truncate">
          {ingredient.name}
        </h5>
        <p className="text-gray-500">
          {ingredient.amount} {ingredient.unit}
        </p>
      </div>
      <div className="text-right flex-shrink-0 space-y-0.5">
        <div className="text-gray-600 text-[11px]">{calories} cal</div>
        {primaryNutrient && (
          <span className="inline-block px-1 py-0.5 bg-purple-100 text-purple-800 text-[9px] rounded-full">
            {primaryNutrient}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Loading indicator component (reuse from FoodView or move to shared)
const LoadingIndicator = ({
  position = "center",
}: {
  position?: "center" | "top" | "bottom";
}) => (
  <div
    className={`flex items-center justify-center p-4 ${
      position === "top"
        ? "sticky top-0 z-10 bg-gradient-to-b from-gray-100 to-transparent"
        : position === "bottom"
        ? "py-4"
        : "h-full"
    }`}
  >
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
  </div>
);

export const IngredientView: React.FC<IngredientViewProps> = ({
  allData,
  recommendationData,
  onIngredientSelect,
  selectedIngredient,
  selectedDate, // Keep for highlighting/context
  onRequestFetch,
  isFetchingPast,
  isFetchingFuture,
  loadedStartDate,
  loadedEndDate,
  // scrollToDate,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const SCROLL_THRESHOLD = 300;
  const FETCH_RANGE_DAYS = 7;

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

    console.log(
      `IngredientView: Calculated ${sortedDates.length} available dates to render.`
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

  // Get combined ingredients for a specific date
  const getCombinedIngredientsForDate = useCallback(
    (targetDate: Date): Array<Ingredient & { isRecommended: boolean }> => {
      const normalizedTargetDate = normalizeDate(targetDate);
      if (!isValidDate(normalizedTargetDate)) return [];

      // 1. Get Trace Ingredients from allData for the target date
      const dayData = getDataForDate(normalizedTargetDate); // Use helper
      const traceIngredients: Ingredient[] = [];
      if (dayData) {
        (dayData.meals || []).forEach((meal) => {
          (meal.foods || []).forEach((food) => {
            (food.ingredients || []).forEach((ingredient) => {
              const key = getIngredientKey(ingredient);
              if (
                key &&
                !traceIngredients.some((t) => getIngredientKey(t) === key)
              ) {
                traceIngredients.push(ingredient);
              }
            });
          });
        });
      }

      // 2. Get Recommended Ingredients for the target date
      const dayRecommendations = recommendationData.find((dayRec) =>
        isSameNormalizedDay(dayRec.date, normalizedTargetDate)
      );
      const recommendedIngredients: Ingredient[] = [];
      if (dayRecommendations) {
        (dayRecommendations.recommendations || []).forEach((rec) => {
          (rec.meal.foods || []).forEach((food) => {
            (food.ingredients || []).forEach((ing) => {
              const key = getIngredientKey(ing);
              if (
                key &&
                !recommendedIngredients.some((r) => getIngredientKey(r) === key)
              ) {
                recommendedIngredients.push(ing);
              }
            });
          });
        });
      }

      // 3. Combine using a Map
      const combinedIngredientMap = new Map<
        string,
        Ingredient & { isRecommended: boolean }
      >();
      traceIngredients.forEach((ing) => {
        const key = getIngredientKey(ing);
        if (key)
          combinedIngredientMap.set(key, { ...ing, isRecommended: false });
      });
      recommendedIngredients.forEach((ing) => {
        const key = getIngredientKey(ing);
        if (key) {
          if (combinedIngredientMap.has(key)) {
            const existing = combinedIngredientMap.get(key)!;
            combinedIngredientMap.set(key, {
              ...existing,
              isRecommended: true,
            });
          } else {
            combinedIngredientMap.set(key, { ...ing, isRecommended: true });
          }
        }
      });

      // 4. Convert map back to array and sort
      const combinedIngredients = Array.from(combinedIngredientMap.values());
      combinedIngredients.sort((a, b) => {
        if (a.category !== b.category)
          return (a.category || "z").localeCompare(b.category || "z");
        return a.name.localeCompare(b.name);
      });

      return combinedIngredients;
    },
    [getDataForDate, recommendationData] // Depend on helper
  );

  // Organize ingredients into bins based on category for a specific date
  const organizeIngredientsIntoBins = useCallback(
    (date: Date) => {
      const ingredientsForDate = getCombinedIngredientsForDate(date);
      const bins: Record<
        string,
        Array<Ingredient & { isRecommended: boolean }>
      > = {};
      const categories = [
        ...new Set(ingredientsForDate.map((ing) => ing.category || "other")),
      ].sort();
      const displayBinNames = categories.map(
        (cat) => cat.charAt(0).toUpperCase() + cat.slice(1)
      );

      displayBinNames.forEach((name) => (bins[name] = []));
      if (categories.includes("other") && !displayBinNames.includes("Other")) {
        bins["Other"] = [];
      }

      ingredientsForDate.forEach((ing) => {
        const categoryName =
          (ing.category || "other").charAt(0).toUpperCase() +
          (ing.category || "other").slice(1);
        const binTarget = bins[categoryName] ? categoryName : "Other";
        if (bins[binTarget]) {
          bins[binTarget].push(ing);
        }
      });

      return {
        bins,
        displayBinNames,
        totalIngredients: ingredientsForDate.length,
      };
    },
    [getCombinedIngredientsForDate]
  );

  // Scroll handler for VERTICAL infinite loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !loadedStartDate || !loadedEndDate) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearTop = scrollTop < SCROLL_THRESHOLD;
    const isNearBottom =
      scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;

    if (isNearTop && !isFetchingPast) {
      console.log("IngredientView: Near top, requesting past data...");
      const fetchEndDate = subDays(loadedStartDate, 1);
      const fetchStartDate = subDays(fetchEndDate, FETCH_RANGE_DAYS - 1);
      const datesToFetch = generateDateRange(fetchStartDate, fetchEndDate);
      if (datesToFetch.length > 0) {
        onRequestFetch({ datesToFetch, direction: "past" });
      }
    }

    if (isNearBottom && !isFetchingFuture) {
      console.log("IngredientView: Near bottom, requesting future data...");
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

  useEffect(() => {
    if (
      scrollContainerRef.current &&
      selectedDate &&
      isValidDate(selectedDate)
    ) {
      const dateId = `date-row-${format(selectedDate, "yyyy-MM-dd")}`;
      // Use requestAnimationFrame to ensure the element is painted before scrolling
      requestAnimationFrame(() => {
        const element = scrollContainerRef.current?.querySelector(
          `#${CSS.escape(dateId)}`
        );
        if (element) {
          // console.log(`IngredientView: Scrolling to ${dateId}`);
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        } else {
          // console.log(`IngredientView: Element ${dateId} not found for scrolling.`);
        }
      });
    }
  }, [selectedDate]);

  console.log(
    `IngredientView: Rendering component. Dates to render: ${allAvailableDates.length}`
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden box-border">
      {/* Fixed header for bins (categories) - This needs rethinking for vertical scroll */}
      {/* We will render headers within each date row instead */}

      {/* Scrollable container for DATES (Vertical Scroll) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50 relative"
      >
        {/* Past Loading Indicator */}
        {isFetchingPast && <LoadingIndicator position="top" />}

        {/* Render Date Rows */}
        <div className="min-w-full divide-y divide-gray-200">
          {allAvailableDates.map((currentDate) => {
            const dateId = `date-row-${format(currentDate, "yyyy-MM-dd")}`;
            if (!isValidDate(currentDate)) {
              console.error(
                "IngredientView: Invalid date object encountered in allAvailableDates",
                currentDate
              );
              return null;
            }
            const isSelectedHighlight = isSameDay(
              normalizeDate(currentDate),
              normalizeDate(selectedDate)
            );
            const { bins, displayBinNames, totalIngredients } =
              organizeIngredientsIntoBins(currentDate);

            return (
              <div
                key={currentDate.toISOString()}
                id={dateId}
                className={`flex flex-col min-h-[180px] ${
                  isSelectedHighlight ? "bg-orange-50" : "bg-white"
                }`}
              >
                {/* Row Header (Date + Categories) */}
                <div
                  className={`flex border-b sticky top-0 z-[5] ${
                    isSelectedHighlight
                      ? "bg-orange-100 border-orange-200"
                      : "bg-gray-100 border-gray-200"
                  }`}
                >
                  {/* Date Cell */}
                  <div
                    className={`w-32 flex-shrink-0 p-4 border-r flex flex-col justify-start ${
                      isSelectedHighlight
                        ? "border-orange-200"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        isSelectedHighlight
                          ? "text-orange-800"
                          : "text-gray-800"
                      }`}
                    >
                      {format(currentDate, "EEE")}
                    </div>
                    <div
                      className={`text-sm ${
                        isSelectedHighlight
                          ? "text-orange-600"
                          : "text-gray-500"
                      }`}
                    >
                      {format(currentDate, "MMM d")}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelectedHighlight
                          ? "text-orange-500"
                          : "text-gray-400"
                      }`}
                    >
                      {format(currentDate, "yyyy")} ({totalIngredients})
                    </div>
                  </div>
                  {/* Category Headers */}
                  <div className="flex flex-1 overflow-x-auto">
                    {displayBinNames.map((binName, index) => (
                      <div
                        key={`${currentDate.toISOString()}-header-${binName}`}
                        className={`flex-1 p-4 text-center font-medium capitalize text-xs ${
                          isSelectedHighlight
                            ? "text-orange-700"
                            : "text-gray-700"
                        } ${index > 0 ? "border-l" : ""} ${
                          isSelectedHighlight
                            ? "border-orange-200"
                            : "border-gray-200"
                        }`}
                        style={{ minWidth: "150px" }} // Ensure min-width for headers
                      >
                        {binName} ({bins[binName]?.length ?? 0})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row Content (Ingredient Bins) */}
                <div className="flex flex-1">
                  {/* Sidebar (Optional) */}
                  <div
                    className={`w-32 flex-shrink-0 p-4 border-r ${
                      isSelectedHighlight
                        ? "border-orange-200"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Add summary info if needed */}
                  </div>
                  {/* Ingredient Bins */}
                  <div className="flex flex-1 overflow-x-auto">
                    {displayBinNames.map((binName, index) => {
                      const binContent = bins[binName];
                      return (
                        <div
                          key={`${currentDate.toISOString()}-content-${binName}`}
                          className={`flex-1 p-1.5 overflow-y-auto min-w-[150px] ${
                            index > 0 ? "border-l" : ""
                          } ${
                            isSelectedHighlight
                              ? "border-orange-200"
                              : "border-gray-200"
                          }`}
                        >
                          <AnimatePresence>
                            {binContent?.map((ingredient) => {
                              const ingredientKey =
                                getIngredientKey(ingredient);
                              const selectedKey = selectedIngredient
                                ? getIngredientKey(selectedIngredient)
                                : null;
                              const isCurrentlySelected =
                                ingredientKey !== null &&
                                ingredientKey === selectedKey;
                              return (
                                <IngredientCard
                                  key={`${ingredientKey}-${ingredient.isRecommended}`}
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
                          {(!binContent || binContent.length === 0) && (
                            <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                              -
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

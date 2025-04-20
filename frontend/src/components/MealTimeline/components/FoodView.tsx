import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Food,
  MealRecommendation,
  DayRecommendations,
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

// Robust date normalization
const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    console.warn(
      "FoodView normalizeDate received null/undefined, returning current date."
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn(
      "FoodView normalizeDate received invalid date, returning current date:",
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

type FetchRequestHandler = (payload: {
  datesToFetch: string[];
  direction: "past" | "future" | "initial" | "specific";
}) => void;

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
  scrollToDate: Date | null;
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
      ? { text: "<15m", color: "bg-green-100 text-green-800" }
      : totalTime <= 30
      ? { text: "15-30m", color: "bg-yellow-100 text-yellow-800" }
      : { text: ">30m", color: "bg-red-100 text-red-800" };

  // Defensive check for nutritionalInfo
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
            ? "bg-green-50/60 border border-dashed border-green-300"
            : "bg-white shadow-sm border border-gray-200"
        }
        ${isSelected ? "ring-2 ring-purple-500" : ""}
        hover:shadow-md transition-all duration-200
        flex items-center space-x-2`}
      onClick={onClick}
    >
      {isRecommended && (
        <span className="absolute -top-1.5 -left-1.5 text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full z-10 shadow-sm">
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
              className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full"
              title="Diabetes Friendly"
            >
              DF
            </span>
          )}
          {totalTime > 0 && (
            <span
              className={`inline-block px-1 py-0.5 ${timeIndicator.color} text-[10px] rounded-full`}
              title={`Prep+Cook: ${totalTime}min`}
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
        ? "sticky top-0 z-10 bg-gradient-to-b from-gray-100 to-transparent"
        : position === "bottom"
        ? "py-4"
        : "h-full"
    }`}
  >
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
  </div>
);

export const FoodView: React.FC<FoodViewProps> = ({
  allData, // Use allData
  recommendationData,
  onFoodSelect,
  selectedFood,
  mealBinNames,
  onMealBinUpdate,
  selectedDate,
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

    console.log(
      `FoodView: Calculated ${sortedDates.length} available dates to render.`
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

  const getCombinedFoodsForDate = useCallback(
    (targetDate: Date): Array<Food & { isRecommended: boolean }> => {
      const normalizedTargetDate = normalizeDate(targetDate);
      if (!isValidDate(normalizedTargetDate)) return [];

      // 1. Get Trace Foods for the specific date using getDataForDate
      const dayData = getDataForDate(normalizedTargetDate); // Use helper
      const traceFoods: Food[] = [];
      if (dayData) {
        (dayData.meals || []).forEach((meal) => {
          (meal.foods || []).forEach((food) => {
            if (
              food &&
              food.id &&
              !traceFoods.some((tf) => tf.id === food.id)
            ) {
              traceFoods.push(food);
            }
          });
        });
      }

      // 2. Get Recommended Foods for this date
      const dayRecommendations = recommendationData.find((dayRec) =>
        isSameNormalizedDay(dayRec.date, normalizedTargetDate)
      );
      const recommendedFoods: Food[] = [];
      if (dayRecommendations) {
        (dayRecommendations.recommendations || []).forEach((rec) => {
          (rec.meal.foods || []).forEach((food) => {
            if (
              food &&
              food.id &&
              !recommendedFoods.some((rf) => rf.id === food.id)
            ) {
              recommendedFoods.push(food);
            }
          });
        });
      }

      // 3. Combine using a Map
      const combinedFoodMap = new Map<
        string,
        Food & { isRecommended: boolean }
      >();
      traceFoods.forEach((food) =>
        combinedFoodMap.set(food.id, { ...food, isRecommended: false })
      );
      recommendedFoods.forEach((food) => {
        if (combinedFoodMap.has(food.id)) {
          const existing = combinedFoodMap.get(food.id)!;
          combinedFoodMap.set(food.id, { ...existing, isRecommended: true });
        } else {
          combinedFoodMap.set(food.id, { ...food, isRecommended: true });
        }
      });

      // 4. Convert map back to array and sort
      const combinedFoods = Array.from(combinedFoodMap.values());
      combinedFoods.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      });

      return combinedFoods;
    },
    [getDataForDate, recommendationData] // Depend on getDataForDate helper
  );

  const organizeFoodsIntoBins = useCallback(
    (date: Date) => {
      const foods = getCombinedFoodsForDate(date);
      const bins: Record<string, Array<Food & { isRecommended: boolean }>> = {};
      mealBinNames.forEach((name) => {
        bins[name] = [];
      });

      // Simple distribution: put all foods in the first bin
      if (mealBinNames.length > 0 && foods.length > 0) {
        bins[mealBinNames[0]] = foods;
      }

      // Auto-adjust bin count (simplified)
      if (foods.length > mealBinNames.length * 5 && mealBinNames.length > 0) {
        const requiredBins = Math.ceil(foods.length / 5);
        if (requiredBins > mealBinNames.length) {
          const newNames = [...mealBinNames];
          while (newNames.length < requiredBins) {
            newNames.push(`Bin ${newNames.length + 1}`);
          }
          setTimeout(() => onMealBinUpdate(newNames), 0);
        }
      }
      return bins;
    },
    [getCombinedFoodsForDate, mealBinNames, onMealBinUpdate]
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
      console.log("FoodView: Near top, requesting past data...");
      const fetchEndDate = subDays(loadedStartDate, 1);
      const fetchStartDate = subDays(fetchEndDate, FETCH_RANGE_DAYS - 1);
      const datesToFetch = generateDateRange(fetchStartDate, fetchEndDate);
      if (datesToFetch.length > 0) {
        onRequestFetch({ datesToFetch, direction: "past" });
      }
    }

    if (isNearBottom && !isFetchingFuture) {
      console.log("FoodView: Near bottom, requesting future data...");
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
          // console.log(`FoodView: Scrolling to ${dateId}`);
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        } else {
          // console.log(`FoodView: Element ${dateId} not found for scrolling.`);
        }
      });
    }
  }, [selectedDate]);

  console.log(
    `FoodView: Rendering component. Dates to render: ${
      allAvailableDates.length
    }, Bins: ${mealBinNames.join(", ")}`
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden box-border">
      {/* Fixed header */}
      <div className="flex border-b bg-white z-10 sticky top-0 flex-shrink-0">
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700 border-r">
          Date
        </div>
        {mealBinNames.map((binName, index) => (
          <div
            key={binName}
            className={`flex-1 p-4 text-center font-medium text-gray-700 ${
              index > 0 ? "border-l" : ""
            }`}
            style={{ minWidth: "150px" }}
          >
            {binName}
          </div>
        ))}
      </div>

      {/* Scrollable container */}
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
            // Defensive check for valid date object
            if (!isValidDate(currentDate)) {
              console.error(
                "FoodView: Invalid date object encountered in allAvailableDates",
                currentDate
              );
              return null; // Skip rendering for invalid date
            }
            const isSelectedHighlight = isSameDay(
              normalizeDate(currentDate),
              normalizeDate(selectedDate)
            );
            const bins = organizeFoodsIntoBins(currentDate);

            return (
              <div
                key={currentDate.toISOString()}
                id={dateId}
                className={`flex min-h-[150px] ${
                  isSelectedHighlight ? "bg-purple-50" : "bg-white"
                }`}
              >
                {/* Date Cell */}
                <div
                  className={`w-32 flex-shrink-0 p-4 border-r flex flex-col justify-start ${
                    isSelectedHighlight
                      ? "border-purple-200"
                      : "border-gray-200"
                  }`}
                >
                  <div
                    className={`font-semibold ${
                      isSelectedHighlight ? "text-purple-800" : "text-gray-800"
                    }`}
                  >
                    {format(currentDate, "EEE")}
                  </div>
                  <div
                    className={`text-sm ${
                      isSelectedHighlight ? "text-purple-600" : "text-gray-500"
                    }`}
                  >
                    {format(currentDate, "MMM d")}
                  </div>
                  <div
                    className={`text-xs ${
                      isSelectedHighlight ? "text-purple-500" : "text-gray-400"
                    }`}
                  >
                    {format(currentDate, "yyyy")}
                  </div>
                </div>

                {/* Food Bins */}
                <div className="flex flex-1">
                  {mealBinNames.map((binName, index) => {
                    const binContent = bins[binName];
                    return (
                      <div
                        key={`${currentDate.toISOString()}-${binName}`}
                        className={`flex-1 p-2 w-full flex flex-col items-stretch justify-center overflow-y-auto ${
                          index > 0 ? "border-l" : ""
                        } ${
                          isSelectedHighlight
                            ? "border-purple-200"
                            : "border-gray-200"
                        }`}
                        style={{ minWidth: "150px" }}
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
                            -
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

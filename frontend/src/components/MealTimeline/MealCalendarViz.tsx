import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  DayRecommendations,
  Meal,
  Food,
  Ingredient,
  VisualizationLevel,
  MealRecommendation,
} from "./types";
// import { LevelSelector } from "./components/LevelSelector";
import { FilterPanel } from "./components/FilterPanel";
import { MealView } from "./components/MealView";
import { FoodView } from "./components/FoodView";
import { IngredientView } from "./components/IngredientView";
import { WeekSelector } from "./components/WeekSelector";
import { MealDetailsPanel } from "./components/MealDetailsPanel";
import { calculateCurrentNutritionalValues } from "./utils/nutritionalUtils";
import { useFilters } from "./hooks/useFilters";
import { transformMealPlanToRecommendations } from "../../utils/mealPlanTransformer";
import { subDays, addDays, isSameDay, format } from "date-fns";

// Normalize date handling function
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const isSameNormalizedDay = (date1: Date, date2: Date): boolean => {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() === d2.getTime();
};

interface MealCalendarVizProps {
  initialData: DayMeals[];
  userPreferences: {
    diabetesFriendly: boolean;
    culturalPreferences: string[];
  };
  nutritionalGoals: {
    dailyCalories: number;
    carbohydrates: { min: number; max: number; unit: string };
    protein: { min: number; max: number; unit: string };
    fiber: { daily: number; unit: string };
  };
  mealPlan?: any;
  onRecommendationSelect?: (recommendation: MealRecommendation) => void;
  onDateRangeChange?: (start: Date, end: Date, selectedDate?: Date) => void;
  initialSelectedDate?: Date;
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({
  initialData,
  userPreferences,
  nutritionalGoals,
  mealPlan,
  onDateRangeChange,
  initialSelectedDate,
}) => {
  // State declarations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekData, setWeekData] = useState<DayMeals[]>(initialData);
  const [recommendationData, setRecommendationData] = useState<
    DayRecommendations[]
  >([]);
  const [currentLevel, setCurrentLevel] =
    useState<VisualizationLevel["type"]>("meal");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialSelectedDate || new Date()
  );
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<MealRecommendation | null>(null);
  const vizRef = React.useRef<HTMLDivElement>(null);
  const [recommendations, setRecommendations] = useState<DayMeals[]>([]);
  const [combinedData, setCombinedData] = useState<DayMeals[]>([]);

  useEffect(() => {
    console.log("selectedDate changed to:", format(selectedDate, "yyyy-MM-dd"));
  }, [selectedDate]);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        if (mealPlan) {
          setLoading(true); // Show loading state while transforming

          // Use a memoized version of the meal plan to prevent unnecessary transformations
          const mealPlanKey = JSON.stringify(mealPlan);
          const cachedRecommendations = sessionStorage.getItem(
            `recommendations-${mealPlanKey}`
          );

          let recommendations;
          if (cachedRecommendations) {
            // Use cached recommendations if available
            recommendations = (
              JSON.parse(cachedRecommendations) as Array<{
                date: string;
                recommendations: MealRecommendation[];
              }>
            ).map(
              (day): DayRecommendations => ({
                ...day,
                date: new Date(day.date), // Convert date strings back to Date objects
              })
            );
          } else {
            // Transform the data if not cached
            const transformedData = await transformMealPlanToRecommendations(
              mealPlan
            );
            recommendations = transformedData.map((day) => ({
              date: day.date,
              recommendations: day.recommendations || [],
            }));

            // Cache the result
            sessionStorage.setItem(
              `recommendations-${mealPlanKey}`,
              JSON.stringify(recommendations)
            );
          }
          setRecommendationData(recommendations);
        }
      } catch (error) {
        console.error("Error transforming meal plan:", error);
        setError("Error loading recommendations");
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [mealPlan]);

  // Add state for nutritional values
  const [currentNutritionalValues, setCurrentNutritionalValues] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fiber: 0,
  });

  const [baseNutritionalValues, setBaseNutritionalValues] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fiber: 0,
  });

  const { filters, updateFilters } = useFilters();

  useEffect(() => {
    const mergeData = () => {
      const merged = new Map<string, DayMeals>();

      // Add initial data to map
      initialData.forEach((day) => {
        const dateKey = day.date.toISOString().split("T")[0];
        merged.set(dateKey, { ...day });
      });

      // Merge recommendations
      recommendations.forEach((day) => {
        const dateKey = day.date.toISOString().split("T")[0];
        if (merged.has(dateKey)) {
          const existingDay = merged.get(dateKey)!;
          merged.set(dateKey, {
            ...existingDay,
          });
        } else {
          merged.set(dateKey, day);
        }
      });

      // Convert map back to array and sort by date
      const sortedData = Array.from(merged.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      setCombinedData(sortedData);
    };

    mergeData();
  }, [initialData, recommendations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vizRef.current && !vizRef.current.contains(event.target as Node)) {
        handleRecommendationSelect(null);
        setSelectedMeal(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);
        // Ensure all dates are properly processed
        const processedData = initialData.map((day) => ({
          ...day,
          date: new Date(day.date),
        }));
        setWeekData(processedData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Error processing data"
        );
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [initialData]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "[") {
        setShowLeftPanel(false);
      } else if (e.key === "]") {
        setShowLeftPanel(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Update nutritional values when week data changes
  useEffect(() => {
    const values = calculateCurrentNutritionalValues(weekData);
    setCurrentNutritionalValues(values);
    setBaseNutritionalValues(values); // Store base values
  }, [weekData]);

  // Meal selection handler
  const handleMealSelect = (meal: Meal | null) => {
    // If selecting a new meal, reset any active recommendation
    if (meal && meal !== selectedMeal) {
      handleRecommendationSelect(null); // Reset recommendation first
    }
    setSelectedMeal(meal);
  };

  // Handle recommendation selection
  const handleRecommendationSelect = (
    recommendation: MealRecommendation | null
  ) => {
    setSelectedRecommendation(recommendation);

    // Reset to base values if deselecting
    if (!recommendation) {
      setCurrentNutritionalValues(baseNutritionalValues);
      return;
    }

    // Update nutritional values with recommendation impact
    setCurrentNutritionalValues({
      calories:
        baseNutritionalValues.calories +
        recommendation.nutritionalImpact.calories,
      carbs:
        baseNutritionalValues.carbs + recommendation.nutritionalImpact.carbs,
      protein:
        baseNutritionalValues.protein +
        recommendation.nutritionalImpact.protein,
      fiber:
        baseNutritionalValues.fiber + recommendation.nutritionalImpact.fiber,
    });
  };

  // Click handler for the main visualization area
  const handleMainAreaClick = (event: React.MouseEvent) => {
    // Check if click is not on a meal or recommendation
    if (
      (event.target as HTMLElement).closest(".meal-card, .recommendation-card")
    ) {
      return;
    }

    handleRecommendationSelect(null);
    setSelectedMeal(null);
  };

  // Filter data for visible range
  const visibleData = useMemo(() => {
    // Ensure we have entries for all three days
    const threeDayDates = [
      normalizeDate(subDays(selectedDate, 1)),
      normalizeDate(selectedDate),
      normalizeDate(addDays(selectedDate, 1)),
    ];

    return threeDayDates.map((date) => {
      // Find existing day data or create empty placeholder
      const existingDay = weekData.find((day) =>
        isSameNormalizedDay(new Date(day.date), date)
      );

      return (
        existingDay || {
          date,
          meals: [],
        }
      );
    });
  }, [weekData, selectedDate]);

  // Handle date change with proper logging
  const handleDateChange = useCallback(
    (newDate: Date) => {
      console.log("Date changed to:", format(newDate, "yyyy-MM-dd"));

      // Update selected date
      setSelectedDate(newDate);

      // Calculate new visible date range
      const newStart = subDays(newDate, 1);
      const newEnd = addDays(newDate, 1);

      console.log(
        "New date range:",
        format(newStart, "yyyy-MM-dd"),
        "to",
        format(newEnd, "yyyy-MM-dd")
      );

      // Check if we need to fetch new data by checking if any date is missing
      const missingDates = [newStart, newDate, newEnd].filter(
        (date) => !weekData.some((day) => isSameDay(new Date(day.date), date))
      );

      if (missingDates.length > 0) {
        console.log(
          "Missing dates:",
          missingDates.map((d) => format(d, "yyyy-MM-dd"))
        );

        // Notify parent component to fetch new data only for missing dates
        if (onDateRangeChange) {
          onDateRangeChange(newStart, newEnd, newDate); // Pass the selected date
        }
      } else {
        console.log("All dates already loaded, no need to fetch new data");
      }

      // Reset selections when changing dates
      setSelectedMeal(null);
      setSelectedRecommendation(null);
    },
    [weekData, onDateRangeChange]
  );

  useEffect(() => {
    if (initialSelectedDate && !isSameDay(initialSelectedDate, selectedDate)) {
      console.log(
        "Syncing with parent's selected date:",
        format(initialSelectedDate, "yyyy-MM-dd")
      );
      setSelectedDate(initialSelectedDate);
    }
  }, [initialSelectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden bg-gray-100"
      ref={vizRef}
    >
      {/* Main Content */}
      <div className="w-full flex-1 flex overflow-hidden">
        {/* Left Panel Container */}
        <motion.div
          initial={false}
          animate={{ width: showLeftPanel ? 320 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 relative z-20"
        >
          {/* Left Panel Content */}
          <AnimatePresence>
            {showLeftPanel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-[320px] bg-white shadow-lg flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div className="w-full px-4 py-3 flex items-center justify-between text-left rounded-t-lg">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Filters
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Customize your meal view
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="overflow-hidden">
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                          <FilterPanel
                            filters={filters}
                            userPreferences={userPreferences}
                            onFilterChange={updateFilters}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Center Calendar View */}
        <div
          className="flex-1 flex flex-col min-w-0 bg-gray-50"
          onClick={handleMainAreaClick}
        >
          {/* Level Selector Bar */}
          <div className="w-full h-16 px-4 bg-white border-b shadow-sm z-10 flex items-center justify-between">
            {/* Left side group */}
            <div className="flex items-center">
              {/* Toggle Button */}
              <motion.button
                initial={false}
                onClick={() => setShowLeftPanel(!showLeftPanel)}
                className="mr-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                    !showLeftPanel ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={!showLeftPanel ? "M15 19l-7-7 7-7" : "M15 5l-7 7 7 7"}
                  />
                </svg>
              </motion.button>
              {/* Divider */}
              {/* <div className="h-8 w-px bg-gray-200 mr-4"></div> */}

              {/* Level Selector */}
              {/* <LevelSelector
                currentLevel={currentLevel}
                onLevelChange={setCurrentLevel}
              />  */}
            </div>

            {/* Right side - Week Selector */}
            <WeekSelector
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
          {/* Main Visualization Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Calendar View */}
            <div className="flex-1 min-w-0 p-4">
              <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden border border-gray-200">
                {currentLevel === "meal" && (
                  <MealView
                    weekData={visibleData}
                    recommendationData={recommendationData}
                    selectedDate={selectedDate}
                    onMealSelect={handleMealSelect}
                    selectedMeal={selectedMeal}
                    onRecommendationSelect={handleRecommendationSelect}
                    selectedRecommendation={selectedRecommendation}
                  />
                )}
                {currentLevel === "food" && (
                  <FoodView
                    weekData={weekData}
                    onFoodSelect={setSelectedFood}
                    selectedFood={selectedFood}
                  />
                )}
                {currentLevel === "ingredient" && (
                  <IngredientView
                    weekData={weekData}
                    onIngredientSelect={setSelectedIngredient}
                    selectedIngredient={selectedIngredient}
                  />
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-[480px] bg-white shadow-lg z-10 flex-shrink-0">
              <MealDetailsPanel
                meal={selectedMeal}
                recommendation={selectedRecommendation}
                onClose={() => {
                  setSelectedMeal(null);
                  handleRecommendationSelect(null);
                }}
                nutritionalGoals={nutritionalGoals}
                currentNutritionalValues={currentNutritionalValues}
                baseNutritionalValues={baseNutritionalValues}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCalendarViz;

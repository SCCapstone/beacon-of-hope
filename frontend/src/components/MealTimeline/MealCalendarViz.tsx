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
import { LevelSelector } from "./components/LevelSelector";
import { MealView } from "./components/MealView";
import { FoodView } from "./components/FoodView";
import { IngredientView } from "./components/IngredientView";
import { WeekSelector } from "./components/WeekSelector";
import { MealDetailsPanel } from "./components/MealDetailsPanel";
import { calculateCurrentNutritionalValues } from "./utils/nutritionalUtils";
import { transformMealPlanToRecommendations } from "../../utils/mealPlanTransformer";
import { subDays, addDays, isSameDay, format, eachDayOfInterval } from "date-fns";

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
    normalizeDate(initialSelectedDate || new Date()) // Normalize initial date
  );
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<MealRecommendation | null>(null);
  const vizRef = React.useRef<HTMLDivElement>(null);
  const [recommendations, setRecommendations] = useState<DayMeals[]>([]);
  const [combinedData, setCombinedData] = useState<DayMeals[]>([]);
  const [mealBinNames, setMealBinNames] = useState<string[]>([
    "Meal 1",
    "Meal 2",
    "Meal 3",
  ]);

  const handleMealBinNamesUpdate = (newNames: string[]) => {
    setMealBinNames(newNames);
    // Optionally save to localStorage for persistence
    localStorage.setItem("mealBinNames", JSON.stringify(newNames));
  };

  useEffect(() => {
    const savedNames = localStorage.getItem("mealBinNames");
    if (savedNames) {
      try {
        const parsedNames = JSON.parse(savedNames);
        if (Array.isArray(parsedNames) && parsedNames.length > 0) {
          setMealBinNames(parsedNames);
        }
      } catch (e) {
        console.error("Error parsing saved meal bin names:", e);
      }
    }
  }, []);

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

  // Calculate dates to display based on level ***
  const datesToDisplay = useMemo(() => {
    const normalizedSelected = normalizeDate(selectedDate);
    let startDate: Date;
    let endDate: Date;

    switch (currentLevel) {
      case "meal": // Show 5 days centered around selectedDate
        startDate = subDays(normalizedSelected, 2);
        endDate = addDays(normalizedSelected, 2);
        break;
      case "food": // Show 3 days (previous, current, next)
        startDate = subDays(normalizedSelected, 1);
        endDate = addDays(normalizedSelected, 1);
        break;
      case "ingredient": // Show only the selected day
      default:
        startDate = normalizedSelected;
        endDate = normalizedSelected;
        break;
    }
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [selectedDate, currentLevel]);

  // Filter data for the calculated visible range
  const visibleData = useMemo(() => {
    // Get data for the dates we need to display
    return datesToDisplay.map((date) => {
      const normalizedDate = normalizeDate(date);
      // Find existing day data or create empty placeholder
      const existingDay = weekData.find((day) =>
        isSameNormalizedDay(new Date(day.date), normalizedDate)
      );
      return (
        existingDay || {
          date: normalizedDate,
          meals: [],
        }
      );
    });
  }, [weekData, datesToDisplay]);

  // Handle date change and trigger potential data fetch
  const handleDateChange = useCallback(
    (newDateInput: Date) => {
        const newDate = normalizeDate(newDateInput); // Normalize the input date
        console.log("Date changed to:", format(newDate, "yyyy-MM-dd"));

        // Update selected date state
        setSelectedDate(newDate);

        // Determine the required range based on the *current* level
        let requiredStartDate: Date;
        let requiredEndDate: Date;
        switch (currentLevel) {
            case 'meal':
                requiredStartDate = subDays(newDate, 3);
                requiredEndDate = addDays(newDate, 3);
                break;
            case 'food':
                requiredStartDate = subDays(newDate, 1);
                requiredEndDate = addDays(newDate, 1);
                break;
            case 'ingredient':
            default:
                requiredStartDate = newDate;
                requiredEndDate = newDate;
                break;
        }

        console.log(
            `Required date range for ${currentLevel} view:`,
            format(requiredStartDate, "yyyy-MM-dd"),
            "to",
            format(requiredEndDate, "yyyy-MM-dd")
        );

        // Check if we need to fetch new data
        const requiredDates = eachDayOfInterval({ start: requiredStartDate, end: requiredEndDate });
        const missingDates = requiredDates.filter(
            (date) => !weekData.some((day) => isSameNormalizedDay(new Date(day.date), date))
        );

        if (missingDates.length > 0) {
            console.log(
                "Missing dates:",
                missingDates.map((d) => format(d, "yyyy-MM-dd"))
            );
            // Notify parent component to fetch new data for the required range
            if (onDateRangeChange) {
                // Fetch the broader range needed for the current view level
                onDateRangeChange(requiredStartDate, requiredEndDate, newDate);
            }
        } else {
            console.log("All required dates already loaded, no need to fetch new data");
        }

        // Reset selections when changing dates
        setSelectedMeal(null);
        setSelectedFood(null); // Reset food selection
        setSelectedIngredient(null); // Reset ingredient selection
        setSelectedRecommendation(null);
    },
    [weekData, onDateRangeChange, currentLevel]
  );

  // Handle level change and trigger potential data fetch
  const handleLevelChange = useCallback((newLevel: VisualizationLevel["type"]) => {
    setCurrentLevel(newLevel);
    setSelectedMeal(null); // Reset selections when changing level
    setSelectedFood(null);
    setSelectedIngredient(null);
    setSelectedRecommendation(null);

    // Trigger a check/fetch for the date range required by the *new* level
    // We can reuse handleDateChange logic by calling it with the current selectedDate
    handleDateChange(selectedDate);

  }, [selectedDate, handleDateChange]); // Depend on handleDateChange

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
      className="w-screen flex flex-col overflow-hidden bg-gray-100"
      ref={vizRef}
      style={{ height: "calc(100vh - 64px)" }} // subtract header height
    >
      {/* Main Content */}
      <div className="w-full flex-1 flex overflow-hidden">
        {/* Center Calendar View */}
        <div
          className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden"
          onClick={handleMainAreaClick}
        >
          {/* Level Selector Bar */}
          <div className="w-full h-16 px-4 bg-white border-b shadow-sm z-10 flex items-center justify-between">
            {/* Left side group */}
            <div className="flex items-center">
              {/* Level Selector */}
              <LevelSelector
                currentLevel={currentLevel}
                onLevelChange={handleLevelChange}
              />
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
            <div className="flex-1 min-w-0 p-4 flex flex-col">
              <div className="bg-white rounded-lg shadow-sm flex-1 overflow-hidden border border-gray-200 flex flex-col">
                {currentLevel === "meal" && (
                  <MealView
                    // Pass datesToDisplay instead of weekData directly for rendering
                    datesToDisplay={datesToDisplay}
                    // Pass the full weekData for lookups if needed inside MealView
                    allData={weekData}
                    recommendationData={recommendationData}
                    selectedDate={selectedDate} // Still needed for context
                    onMealSelect={handleMealSelect}
                    selectedMeal={selectedMeal}
                    onRecommendationSelect={handleRecommendationSelect}
                    selectedRecommendation={selectedRecommendation}
                    mealBinNames={mealBinNames}
                    onMealBinUpdate={handleMealBinNamesUpdate}
                  />
                )}
                {currentLevel === "food" && (
                  <FoodView
                    datesToDisplay={visibleData}
                    allData={weekData} // Pass full data for lookups
                    onFoodSelect={setSelectedFood}
                    selectedFood={selectedFood}
                    mealBinNames={mealBinNames} // Pass bin names
                    onMealBinUpdate={handleMealBinNamesUpdate} // Pass update handler
                    // Add other necessary props like recommendationData if needed
                  />
                )}
                {currentLevel === "ingredient" && (
                  <IngredientView
                    // Ingredient view focuses on one day
                    selectedDateData={visibleData.find(d => isSameNormalizedDay(d.date, selectedDate))}
                    onIngredientSelect={setSelectedIngredient}
                    selectedIngredient={selectedIngredient}
                    mealBinNames={mealBinNames} // Pass bin names
                    onMealBinUpdate={handleMealBinNamesUpdate} // Pass update handler
                    // Add other necessary props
                  />
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-[480px] bg-white shadow-lg z-10 flex-shrink-0">
              <MealDetailsPanel
                // Pass all selected items, let the panel decide what to show
                meal={selectedMeal}
                food={selectedFood} // Pass selected food
                ingredient={selectedIngredient} // Pass selected ingredient
                recommendation={selectedRecommendation}
                onClose={() => {
                  setSelectedMeal(null);
                  setSelectedFood(null);
                  setSelectedIngredient(null);
                  handleRecommendationSelect(null);
                }}
                nutritionalGoals={nutritionalGoals}
                currentNutritionalValues={currentNutritionalValues}
                baseNutritionalValues={baseNutritionalValues}
                selectedDate={selectedDate}
                currentLevel={currentLevel} // Pass current level for context
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCalendarViz;

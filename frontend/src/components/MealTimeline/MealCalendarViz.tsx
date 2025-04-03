import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  subDays,
  addDays,
  format,
  eachDayOfInterval,
} from "date-fns";

// Normalize date handling function
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const isSameNormalizedDay = (date1: Date, date2: Date): boolean => {
  if (!date1 || !date2) return false; // Guard against null/undefined dates
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() === d2.getTime();
};

interface MealCalendarVizProps {
  // Renamed prop: Use data passed from parent directly
  mealData: DayMeals[];
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
  onDateRangeChange: (start: Date, end: Date, selectedDate?: Date) => void; // Make mandatory
  initialSelectedDate?: Date;
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({
  // Use mealData prop directly
  mealData,
  nutritionalGoals,
  mealPlan,
  onDateRangeChange,
  initialSelectedDate,
}) => {
  // State declarations
  const [loadingRecommendations, setLoadingRecommendations] = useState(false); // Separate loading state for recommendations
  const [error, setError] = useState<string | null>(null);
  const [recommendationData, setRecommendationData] = useState<
    DayRecommendations[]
  >([]);
  const [currentLevel, setCurrentLevel] =
    useState<VisualizationLevel["type"]>("meal");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  // Use initialSelectedDate from props, default to today if not provided
  const [selectedDate, setSelectedDate] = useState<Date>(
    normalizeDate(initialSelectedDate || new Date())
  );
  const [_, setShowLeftPanel] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<MealRecommendation | null>(null);
  const vizRef = React.useRef<HTMLDivElement>(null);
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

  // Load saved meal bin names
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

  // Log selectedDate changes
  useEffect(() => {
    console.log("Viz: selectedDate changed to:", format(selectedDate, "yyyy-MM-dd"));
  }, [selectedDate]);

  // Sync selectedDate with parent prop if it changes externally
  useEffect(() => {
      const normalizedInitial = initialSelectedDate ? normalizeDate(initialSelectedDate) : null;
      if (normalizedInitial && !isSameNormalizedDay(normalizedInitial, selectedDate)) {
          console.log(
              "Viz: Syncing selectedDate with parent prop:",
              format(normalizedInitial, "yyyy-MM-dd")
          );
          setSelectedDate(normalizedInitial);
      }
  }, [initialSelectedDate, selectedDate]); // Add selectedDate dependency


  // Load recommendations based on mealPlan prop
  useEffect(() => {
    async function loadRecommendations() {
      try {
        if (mealPlan && Object.keys(mealPlan).length > 0) { // Check if mealPlan is not empty
          setLoadingRecommendations(true);
          setError(null); // Clear previous errors

          // Use a memoized version of the meal plan to prevent unnecessary transformations
          const mealPlanKey = JSON.stringify(mealPlan);
          const cachedRecommendations = sessionStorage.getItem(
            `recommendations-${mealPlanKey}`
          );

          let recommendations: DayRecommendations[];
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
                date: normalizeDate(new Date(day.date)), // Normalize date on load
              })
            );
            console.log("Viz: Loaded recommendations from cache.");
          } else {
            console.log("Viz: Transforming meal plan to recommendations...");
            const transformedData = await transformMealPlanToRecommendations(
              mealPlan
            );
            recommendations = transformedData.map((day) => ({
              date: normalizeDate(day.date), // Normalize date on transform
              recommendations: day.recommendations || [],
            }));
            console.log("Viz: Transformation complete.");
            sessionStorage.setItem(
              `recommendations-${mealPlanKey}`,
              JSON.stringify(recommendations)
            );
          }
          setRecommendationData(recommendations);
        } else {
            // If no meal plan, ensure recommendation data is empty
            setRecommendationData([]);
            console.log("Viz: No meal plan provided, clearing recommendations.");
        }
      } catch (error) {
        console.error("Viz: Error transforming meal plan:", error);
        setError("Error loading recommendations");
        setRecommendationData([]); // Clear data on error
      } finally {
        setLoadingRecommendations(false);
      }
    }

    loadRecommendations();
  }, [mealPlan]); // Rerun when mealPlan changes

  // State for nutritional values
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

  // Handle clicks outside interactive elements
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vizRef.current && !vizRef.current.contains(event.target as Node)) {
        // Check if the click target is outside the panel as well
        if (!(event.target as HTMLElement).closest('.meal-details-panel-container')) {
            handleRecommendationSelect(null);
            setSelectedMeal(null);
            setSelectedFood(null);
            setSelectedIngredient(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Removed useEffect processing initialData into weekData state

  // Handle keyboard shortcuts for panel visibility
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

  // Update nutritional values when mealData (prop) changes
  useEffect(() => {
    // Calculate based on the data for the currently selected date
    const dayData = mealData.find(day => isSameNormalizedDay(day.date, selectedDate));
    const values = calculateCurrentNutritionalValues(dayData ? [dayData] : []); // Calculate for single day
    setCurrentNutritionalValues(values);
    setBaseNutritionalValues(values); // Store base values for the selected day
    console.log("Viz: Updated nutritional values for selected date", selectedDate, values);
  }, [mealData, selectedDate]); // Depend on mealData prop and selectedDate

  // Meal selection handler
  const handleMealSelect = (meal: Meal | null) => {
    if (meal && meal !== selectedMeal) {
      handleRecommendationSelect(null);
    }
    setSelectedMeal(meal);
    setSelectedFood(null); // Clear other selections
    setSelectedIngredient(null);
  };

  // Food selection handler
  const handleFoodSelect = (food: Food | null) => {
      if (food && food !== selectedFood) {
          handleRecommendationSelect(null);
      }
      setSelectedFood(food);
      setSelectedMeal(null); // Clear other selections
      setSelectedIngredient(null);
  };

  // Ingredient selection handler
  const handleIngredientSelect = (ingredient: Ingredient | null) => {
      if (ingredient && ingredient !== selectedIngredient) {
          handleRecommendationSelect(null);
      }
      setSelectedIngredient(ingredient);
      setSelectedMeal(null); // Clear other selections
      setSelectedFood(null);
  };


  // Handle recommendation selection
  const handleRecommendationSelect = (
    recommendation: MealRecommendation | null
  ) => {
    setSelectedRecommendation(recommendation);
    setSelectedMeal(null); // Clear other selections
    setSelectedFood(null);
    setSelectedIngredient(null);

    // Reset to base values if deselecting
    if (!recommendation) {
      setCurrentNutritionalValues(baseNutritionalValues);
      return;
    }

    // Update nutritional values with recommendation impact (relative to the day's base)
    setCurrentNutritionalValues({
      calories:
        baseNutritionalValues.calories +
        (recommendation.nutritionalImpact?.calories || 0),
      carbs:
        baseNutritionalValues.carbs +
        (recommendation.nutritionalImpact?.carbs || 0),
      protein:
        baseNutritionalValues.protein +
        (recommendation.nutritionalImpact?.protein || 0),
      fiber:
        baseNutritionalValues.fiber +
        (recommendation.nutritionalImpact?.fiber || 0),
    });
  };

  // Click handler for the main visualization area to deselect items
  const handleMainAreaClick = (event: React.MouseEvent) => {
    // Check if the click is on the background of the viz area, not on cards/buttons etc.
    if (
      (event.target as HTMLElement).classList.contains('meal-view-background') ||
      (event.target as HTMLElement).classList.contains('food-view-background') ||
      (event.target as HTMLElement).classList.contains('ingredient-view-background')
      // Add similar checks if needed, or check if the target IS the background div
    ) {
        handleRecommendationSelect(null);
        setSelectedMeal(null);
        setSelectedFood(null);
        setSelectedIngredient(null);
    } else if (
        // More robust check: ensure click wasn't inside any interactive element
        !(event.target as HTMLElement).closest(
            ".meal-card, .recommendation-card, .level-selector, button, .food-card, .ingredient-card, .week-selector-container" // Added specific card classes
        )
    ) {
        handleRecommendationSelect(null);
        setSelectedMeal(null);
        setSelectedFood(null);
        setSelectedIngredient(null);
    }
  };

  // Calculate dates to display based on level and selectedDate
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
    // Ensure start date is not after end date (can happen if logic is complex)
    if (startDate > endDate) {
        startDate = endDate;
    }
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [selectedDate, currentLevel]);

  // Filter data for the calculated visible range using mealData prop
  const visibleData = useMemo(() => {
    console.log("Viz: Recalculating visibleData. Dates to display:", datesToDisplay.map(d => format(d, 'yyyy-MM-dd')));
    return datesToDisplay.map((date) => {
      const normalizedDate = normalizeDate(date);
      // Find existing day data from mealData prop or create empty placeholder
      const existingDay = mealData.find((day) =>
        isSameNormalizedDay(new Date(day.date), normalizedDate)
      );
      if (existingDay) {
        // console.log(`Viz: Found data for ${format(normalizedDate, 'yyyy-MM-dd')}`);
        return existingDay;
      } else {
        // console.log(`Viz: No data found for ${format(normalizedDate, 'yyyy-MM-dd')}, creating placeholder.`);
        return {
          date: normalizedDate,
          meals: [],
        };
      }
    });
  // Depend on mealData prop and datesToDisplay
  }, [mealData, datesToDisplay]);

  // Calculate required date range based on a given level and date
  const getRequiredRange = useCallback((level: VisualizationLevel["type"], date: Date) => {
      const normalizedDate = normalizeDate(date);
      let requiredStartDate: Date;
      let requiredEndDate: Date;
      switch (level) {
          case "meal":
              requiredStartDate = subDays(normalizedDate, 3); // Fetch 7 days for meal view buffer
              requiredEndDate = addDays(normalizedDate, 3);
              break;
          case "food":
              requiredStartDate = subDays(normalizedDate, 1); // Fetch 3 days for food view
              requiredEndDate = addDays(normalizedDate, 1);
              break;
          case "ingredient":
          default:
              requiredStartDate = normalizedDate; // Fetch 1 day for ingredient view
              requiredEndDate = normalizedDate;
              break;
      }
      return { requiredStartDate, requiredEndDate };
  }, []);


  // Handle date change and trigger potential data fetch
  const handleDateChange = useCallback(
    (newDateInput: Date) => {
      const newDate = normalizeDate(newDateInput);
      console.log("Viz: handleDateChange called with:", format(newDate, "yyyy-MM-dd"));

      // Update selected date state immediately for responsiveness
      setSelectedDate(newDate);

      // Determine the required range based on the *current* level
      const { requiredStartDate, requiredEndDate } = getRequiredRange(currentLevel, newDate);

      console.log(
        `Viz: Required date range for ${currentLevel} view:`,
        format(requiredStartDate, "yyyy-MM-dd"),
        "to",
        format(requiredEndDate, "yyyy-MM-dd")
      );

      // Check if we need to fetch new data using mealData prop
      const requiredDates = eachDayOfInterval({
        start: requiredStartDate,
        end: requiredEndDate,
      });
      const missingDates = requiredDates.filter(
        (date) =>
          !mealData.some((day) => isSameNormalizedDay(new Date(day.date), date))
      );

      if (missingDates.length > 0) {
        console.log(
          "Viz: Missing dates:",
          missingDates.map((d) => format(d, "yyyy-MM-dd"))
        );
        // Notify parent component to fetch new data for the required range
        onDateRangeChange(requiredStartDate, requiredEndDate, newDate);
      } else {
        console.log(
          "Viz: All required dates already loaded, no need to fetch new data"
        );
      }

      // Reset selections when changing dates
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);
    },
    // Depend on mealData prop, currentLevel, onDateRangeChange, getRequiredRange
    [mealData, currentLevel, onDateRangeChange, getRequiredRange]
  );

  // Handle level change and trigger potential data fetch
  const handleLevelChange = useCallback(
    (newLevel: VisualizationLevel["type"]) => {
      console.log("Viz: handleLevelChange called with:", newLevel);
      setCurrentLevel(newLevel); // Update level state

      // Reset selections when changing level
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);

      // Determine the required range based on the *new* level and *current* selectedDate
      const { requiredStartDate, requiredEndDate } = getRequiredRange(newLevel, selectedDate);

      console.log(
        `Viz: Required date range for ${newLevel} view:`,
        format(requiredStartDate, "yyyy-MM-dd"),
        "to",
        format(requiredEndDate, "yyyy-MM-dd")
      );

      // Check if data for the required range is missing using mealData prop
      const requiredDates = eachDayOfInterval({
        start: requiredStartDate,
        end: requiredEndDate,
      });
      const missingDates = requiredDates.filter(
        (date) =>
          !mealData.some((day) => isSameNormalizedDay(new Date(day.date), date))
      );

      if (missingDates.length > 0) {
        console.log(
          "Viz: Missing dates for new level:",
          missingDates.map((d) => format(d, "yyyy-MM-dd"))
        );
        // Notify parent to fetch, passing the current selectedDate
        onDateRangeChange(requiredStartDate, requiredEndDate, selectedDate);
      } else {
        console.log("Viz: All required dates already loaded for new level");
      }
    },
    // Depend on mealData prop, selectedDate, onDateRangeChange, getRequiredRange
    [mealData, selectedDate, onDateRangeChange, getRequiredRange]
  );


  // Render loading state (consider separate loading for recommendations vs initial data)
  // The parent now handles the main loading state. We only show recommendation loading.
  // if (isLoading) { // Removed - Parent handles main loading
  //   return (
  //     <div className="flex items-center justify-center h-96">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <p>Error in Visualization: {error}</p>
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
      <div className="w-full h-full flex flex-col overflow-hidden box-border">
        {/* Center Calendar View */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">
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
            {/* Wrap WeekSelector for click handling */}
             <div className="week-selector-container">
                <WeekSelector
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                />
             </div>
          </div>
          {/* Main Visualization Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Calendar View */}
            <div className="flex-1 min-w-0 p-4 flex flex-col">
              <div
                className="bg-white rounded-lg shadow-sm flex-1 overflow-hidden border border-gray-200 flex flex-col"
                // Attach click handler here for deselection
                onClick={handleMainAreaClick}
              >
                {/* Add background divs for better click target detection */}
                {currentLevel === "meal" && (
                  <div className="meal-view-background h-full">
                    <MealView
                      // Pass datesToDisplay to determine layout
                      datesToDisplay={datesToDisplay}
                      // Pass the full mealData prop for lookups
                      allData={mealData}
                      recommendationData={recommendationData}
                      selectedDate={selectedDate}
                      onMealSelect={handleMealSelect}
                      selectedMeal={selectedMeal}
                      onRecommendationSelect={handleRecommendationSelect}
                      selectedRecommendation={selectedRecommendation}
                      mealBinNames={mealBinNames}
                      onMealBinUpdate={handleMealBinNamesUpdate}
                      isLoading={loadingRecommendations} // Pass recommendation loading state
                    />
                  </div>
                )}
                {currentLevel === "food" && (
                   <div className="food-view-background h-full">
                      <FoodView
                        // Pass visibleData which contains DayMeals objects for the required dates
                        datesToDisplay={visibleData}
                        // Pass full mealData prop for lookups if needed (e.g., context)
                        allData={mealData}
                        onFoodSelect={handleFoodSelect} // Use specific handler
                        selectedFood={selectedFood}
                        mealBinNames={mealBinNames}
                        onMealBinUpdate={handleMealBinNamesUpdate}
                        selectedRecommendation={selectedRecommendation}
                        selectedDate={selectedDate}
                      />
                   </div>
                )}
                {currentLevel === "ingredient" && (
                   <div className="ingredient-view-background h-full">
                      <IngredientView
                        // Ingredient view focuses on one day's data from visibleData
                        selectedDateData={visibleData.find((d) =>
                          isSameNormalizedDay(d.date, selectedDate)
                        )}
                        onIngredientSelect={handleIngredientSelect} // Use specific handler
                        selectedIngredient={selectedIngredient}
                        mealBinNames={mealBinNames}
                        onMealBinUpdate={handleMealBinNamesUpdate}
                        selectedRecommendation={selectedRecommendation}
                        selectedDate={selectedDate}
                      />
                   </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
            {/* Wrap panel in a container for click detection */}
            <div className="meal-details-panel-container w-[480px] bg-white shadow-lg z-10 flex-shrink-0 border-l border-gray-200">
              <MealDetailsPanel
                meal={selectedMeal}
                food={selectedFood}
                ingredient={selectedIngredient}
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
                currentLevel={currentLevel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCalendarViz;

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  isSameDay,
} from "date-fns";

// Normalize date handling function
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Use isSameDay from date-fns for consistency
const isSameNormalizedDay = (
  date1: Date | null | undefined,
  date2: Date | null | undefined
): boolean => {
  if (!date1 || !date2) return false; // Guard against null/undefined dates
  // No need to normalize manually if using isSameDay
  return isSameDay(date1, date2);
};

// Define the type for the callback to parent
type FetchRequestHandler = (payload: {
  datesToFetch: string[]; // Only the dates that *need* fetching
  newSelectedDate?: Date; // The date that triggered this check
}) => void;

interface MealCalendarVizProps {
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
  // onDateRangeChange: (start: Date, end: Date, selectedDate?: Date) => void;
  onRequestFetch: FetchRequestHandler;
  initialSelectedDate?: Date;
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({
  mealData,
  nutritionalGoals,
  mealPlan,
  onRequestFetch,
  initialSelectedDate,
}) => {
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
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
  const [selectedDate, setSelectedDate] = useState<Date>(
    normalizeDate(initialSelectedDate || new Date())
  );
  const [_, setShowLeftPanel] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<MealRecommendation | null>(null);
  const vizRef = useRef<HTMLDivElement>(null);
  const [mealBinNames, setMealBinNames] = useState<string[]>([
    "Meal 1",
    "Meal 2",
    "Meal 3",
  ]);
  const mealDataRef = useRef(mealData); // Ref to hold current mealData for effect check

  // Keep mealDataRef updated without causing effect re-runs based on mealData itself
  useEffect(() => {
    mealDataRef.current = mealData;
  }, [mealData]);

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
    console.log(
      "Viz: selectedDate state changed to:",
      format(selectedDate, "yyyy-MM-dd")
    );
  }, [selectedDate]);

  // Sync selectedDate with parent prop if it changes externally
  useEffect(() => {
    const normalizedInitial = initialSelectedDate
      ? normalizeDate(initialSelectedDate)
      : null;
    // Use isSameDay for comparison
    if (normalizedInitial && !isSameDay(normalizedInitial, selectedDate)) {
      console.log(
        "Viz: Syncing selectedDate with parent prop:",
        format(normalizedInitial, "yyyy-MM-dd")
      );
      setSelectedDate(normalizedInitial);
    }
    // Ensure initialSelectedDate is stable or handled appropriately
  }, [initialSelectedDate]);

  // Load recommendations based on mealPlan prop
  useEffect(() => {
    async function loadRecommendations() {
      try {
        if (mealPlan && Object.keys(mealPlan).length > 0) {
          // Check if mealPlan is not empty
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
        if (
          !(event.target as HTMLElement).closest(
            ".meal-details-panel-container"
          )
        ) {
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

  // Update nutritional values when mealData or selectedDate changes
  useEffect(() => {
    // Use isSameDay for comparison
    const dayData = mealData.find((day) =>
      isSameDay(normalizeDate(new Date(day.date)), selectedDate)
    );
    const values = calculateCurrentNutritionalValues(dayData ? [dayData] : []);
    setCurrentNutritionalValues(values);
    setBaseNutritionalValues(values);
    console.log(
      "Viz: Updated nutritional values for selected date",
      format(selectedDate, "yyyy-MM-dd"),
      values
    );
  }, [mealData, selectedDate]);

  // --- Selection Handlers (Keep as they are) ---
  const handleMealSelect = (meal: Meal | null) => {
    // if (meal && meal !== selectedMeal) handleRecommendationSelect(null);
    // Selecting a trace meal clears everything else
    setSelectedMeal(meal);
    setSelectedFood(null);
    setSelectedIngredient(null);
    setSelectedRecommendation(null); // Clear recommendation too
    if (!meal) setCurrentNutritionalValues(baseNutritionalValues); // Reset nutrition if deselecting
  };

  // UPDATED handleFoodSelect
  const handleFoodSelect = (food: Food | null, isRecommended?: boolean) => {
    // If a recommended food is clicked, find and select its parent recommendation
    if (food && isRecommended) {
      const normalizedSelected = normalizeDate(selectedDate);
      const dayRecs = recommendationData.find((day) =>
        isSameDay(normalizeDate(new Date(day.date)), normalizedSelected)
      );
      const parentRecommendation = dayRecs?.recommendations.find((rec) =>
        rec.meal.foods.some((f) => f.id === food.id)
      );

      if (parentRecommendation) {
        console.log(
          "Viz: Recommended food clicked, selecting parent recommendation:",
          parentRecommendation.meal.name
        );
        handleRecommendationSelect(parentRecommendation); // This sets recommendation and clears others
        return; // Exit early
      } else {
        // Fallback if parent recommendation not found (shouldn't normally happen)
        console.warn(
          "Viz: Recommended food clicked, but couldn't find parent recommendation. Selecting food only."
        );
        setSelectedFood(food);
        setSelectedMeal(null);
        setSelectedIngredient(null);
        setSelectedRecommendation(null); // Ensure recommendation is cleared
      }
    } else {
      // Handle trace food selection or deselection
      console.log("Viz: Trace food clicked or deselecting food.");
      setSelectedFood(food);
      setSelectedMeal(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null); // Clear recommendation on trace select/deselect
    }

    // Reset nutrition only if nothing is selected at all
    if (
      !food &&
      !selectedMeal &&
      !selectedIngredient &&
      !selectedRecommendation
    ) {
      setCurrentNutritionalValues(baseNutritionalValues);
    }
  };

  // UPDATED handleIngredientSelect
  const handleIngredientSelect = (
    ingredient: Ingredient | null,
    isRecommended?: boolean
  ) => {
    // If a recommended ingredient is clicked, find and select its parent recommendation
    if (ingredient && isRecommended) {
      const normalizedSelected = normalizeDate(selectedDate);
      const dayRecs = recommendationData.find((day) =>
        isSameDay(normalizeDate(new Date(day.date)), normalizedSelected)
      );
      const parentRecommendation = dayRecs?.recommendations.find((rec) =>
        rec.meal.foods.some((food) =>
          food.ingredients.some(
            (ing) =>
              ing.id === ingredient.id ||
              (!ing.id && !ingredient.id && ing.name === ingredient.name) // Handle missing IDs
          )
        )
      );

      if (parentRecommendation) {
        console.log(
          "Viz: Recommended ingredient clicked, selecting parent recommendation:",
          parentRecommendation.meal.name
        );
        handleRecommendationSelect(parentRecommendation); // This sets recommendation and clears others
        return; // Exit early
      } else {
        // Fallback if parent recommendation not found
        console.warn(
          "Viz: Recommended ingredient clicked, but couldn't find parent recommendation. Selecting ingredient only."
        );
        setSelectedIngredient(ingredient);
        setSelectedMeal(null);
        setSelectedFood(null);
        setSelectedRecommendation(null); // Ensure recommendation is cleared
      }
    } else {
      // Handle trace ingredient selection or deselection
      console.log("Viz: Trace ingredient clicked or deselecting ingredient.");
      setSelectedIngredient(ingredient);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedRecommendation(null); // Clear recommendation on trace select/deselect
    }

    // Reset nutrition only if nothing is selected at all
    if (
      !ingredient &&
      !selectedMeal &&
      !selectedFood &&
      !selectedRecommendation
    ) {
      setCurrentNutritionalValues(baseNutritionalValues);
    }
  };

  // handleRecommendationSelect remains the same
  const handleRecommendationSelect = (
    recommendation: MealRecommendation | null
  ) => {
    // Selecting a recommendation clears specific trace selections
    setSelectedRecommendation(recommendation);
    setSelectedMeal(null);
    setSelectedFood(null);
    setSelectedIngredient(null);

    // Reset to base values if deselecting recommendation
    if (!recommendation) {
      setCurrentNutritionalValues(baseNutritionalValues);
      return;
    }

    // Update nutritional values with recommendation impact
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
    const target = event.target as HTMLElement;
    // Check if the click was directly on the background elements
    const isBackgroundClick =
      target.classList.contains("meal-view-background") ||
      target.classList.contains("food-view-background") ||
      target.classList.contains("ingredient-view-background") ||
      target.classList.contains("viz-main-area"); // Add a class to the main container div

    // Check if the click was inside a known interactive element that handles its own selection
    const isInteractiveElementClick = target.closest(
      ".meal-card, .recommendation-card, .level-selector, button, .food-card-item, .ingredient-card-item, .week-selector-container, input[type='date']"
    );

    // Deselect only if the click was on the background OR if it wasn't inside any known interactive element
    if (isBackgroundClick || !isInteractiveElementClick) {
      // Check if the click target is outside the details panel as well before deselecting
      if (
        !(event.target as HTMLElement).closest(".meal-details-panel-container")
      ) {
        handleRecommendationSelect(null);
        setSelectedMeal(null);
        setSelectedFood(null);
        setSelectedIngredient(null);
      } else {
        console.log("Viz: Click was inside details panel, not deselecting.");
      }
    } else {
      console.log(
        "Viz: Click was on an interactive element, not deselecting.",
        target
      );
    }
  };

  // Calculate required date range based on a given level and date
  const getRequiredRange = useCallback(
    (level: VisualizationLevel["type"], date: Date) => {
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
    },
    []
  );

  // Handle date change and trigger potential data fetch
  const handleDateChange = useCallback(
    (newDateInput: Date) => {
      const newDate = normalizeDate(newDateInput);
      console.log(
        "Viz: handleDateChange called with:",
        format(newDate, "yyyy-MM-dd")
      );

      // Update selected date state immediately
      setSelectedDate(newDate);

      // Reset selections when changing dates
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);

      // The useEffect below will handle the fetch check
    },
    [] // No dependencies needed here as it only sets state
  );

  // 2. Handle Level Change (Updates state immediately, triggers effect for fetch)
  const handleLevelChange = useCallback(
    (newLevel: VisualizationLevel["type"]) => {
      console.log("Viz: handleLevelChange called with:", newLevel);
      // Update level state immediately
      setCurrentLevel(newLevel);

      // Reset selections when changing level
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);

      // The useEffect below will handle the fetch check
    },
    [] // No dependencies needed here as it only sets state
  );

  // 3. useEffect to Trigger Data Fetch on Date or Level Change
  useEffect(() => {
    console.log(
      `Viz Effect: Checking fetch for level=${currentLevel}, date=${format(
        selectedDate,
        "yyyy-MM-dd"
      )}`
    );

    const { requiredStartDate, requiredEndDate } = getRequiredRange(
      currentLevel,
      selectedDate
    );
    const requiredDates = eachDayOfInterval({
      start: requiredStartDate,
      end: requiredEndDate,
    });

    // Use the ref for the most current mealData within the effect closure
    const currentMealData = mealDataRef.current;
    const existingDates = new Set(
      currentMealData.map((day) =>
        format(normalizeDate(new Date(day.date)), "yyyy-MM-dd")
      )
    );

    const missingDateStrings = requiredDates
      .map((date) => format(date, "yyyy-MM-dd"))
      .filter((dateStr) => !existingDates.has(dateStr));

    // --- Crucial Change: Only call parent if dates are actually missing ---
    if (missingDateStrings.length > 0) {
      console.log(
        "Viz Effect: Requesting fetch for missing dates:",
        missingDateStrings
      );
      onRequestFetch({
        datesToFetch: missingDateStrings,
        newSelectedDate: selectedDate, // Pass the date that triggered this check
      });
    } else {
      console.log(
        "Viz Effect: All required dates already loaded. No fetch request needed."
      );
      // Do NOT call onRequestFetch if nothing is missing
    }
    // --- End Crucial Change ---

    // Dependencies: Run when level or date changes. `getRequiredRange` and `onRequestFetch` should be stable.
  }, [currentLevel, selectedDate, getRequiredRange, onRequestFetch]);

  // Calculate dates to display based on level and selectedDate
  const datesToDisplay = useMemo(() => {
    const normalizedSelected = normalizeDate(selectedDate);
    let startDate: Date;
    let endDate: Date;

    switch (currentLevel) {
      case "meal":
        startDate = subDays(normalizedSelected, 2);
        endDate = addDays(normalizedSelected, 2);
        break;
      case "food":
        startDate = subDays(normalizedSelected, 1);
        endDate = addDays(normalizedSelected, 1);
        break;
      case "ingredient":
      default:
        startDate = normalizedSelected;
        endDate = normalizedSelected;
        break;
    }
    if (startDate > endDate) startDate = endDate;
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [selectedDate, currentLevel]);

  // Filter data for the calculated visible range using mealData prop
  const visibleData = useMemo(() => {
    console.log(
      "Viz: Recalculating visibleData. Dates to display:",
      datesToDisplay.map((d) => format(d, "yyyy-MM-dd"))
    );
    return datesToDisplay.map((date) => {
      const normalizedDate = normalizeDate(date);
      // Use isSameDay for comparison
      const existingDay = mealData.find((day) =>
        isSameNormalizedDay(day.date, normalizedDate)
      );
      if (existingDay) {
        console.log(
          `Viz: Found data for ${format(normalizedDate, "yyyy-MM-dd")}`
        );
        return existingDay;
      } else {
        console.log(
          `Viz: No data found for ${format(
            normalizedDate,
            "yyyy-MM-dd"
          )}, creating placeholder.`
        );
        return {
          date: normalizedDate,
          meals: [],
        };
      }
    });
  }, [mealData, datesToDisplay]);

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

  // Add console log to check rendering state
  console.log(`Viz: Rendering with currentLevel = ${currentLevel}`);

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
                className="viz-main-area bg-white rounded-lg shadow-sm flex-1 overflow-hidden border border-gray-200 flex flex-col" // Added viz-main-area class
                onClick={handleMainAreaClick} // Attach click handler here
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
                      onMealBinUpdate={setMealBinNames} // Pass setter directly
                      isLoading={loadingRecommendations}
                    />
                  </div>
                )}
                {currentLevel === "food" && (
                  <div className="food-view-background h-full">
                    {(() => {
                      console.log("Viz: Rendering FoodView block");
                      console.log("Viz: Props for FoodView:", {
                        datesToDisplay: visibleData,
                        allData: mealData,
                        selectedFood,
                        mealBinNames,
                        selectedRecommendation,
                        selectedDate,
                      });
                      return null;
                    })()}
                    {/* Add detailed prop log */}
                    <FoodView
                      // Pass visibleData which contains DayMeals objects for the required dates
                      datesToDisplay={visibleData}
                      // Pass full mealData prop for lookups if needed (e.g., context)
                      allData={mealData}
                      recommendationData={recommendationData}
                      onFoodSelect={handleFoodSelect} // Use specific handler
                      selectedFood={selectedFood}
                      mealBinNames={mealBinNames}
                      onMealBinUpdate={setMealBinNames} // Pass setter directly
                      selectedRecommendation={selectedRecommendation}
                      selectedDate={selectedDate}
                    />
                  </div>
                )}
                {currentLevel === "ingredient" && (
                  <div className="ingredient-view-background h-full">
                    <IngredientView
                      // Ingredient view focuses on one day's data from visibleData
                      selectedDateData={visibleData.find(
                        (d) => isSameDay(d.date, selectedDate) // Use isSameDay
                      )}
                      recommendationData={recommendationData}
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

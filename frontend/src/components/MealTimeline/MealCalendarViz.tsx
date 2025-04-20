import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DayMeals,
  DayRecommendations,
  Meal,
  Food,
  Ingredient,
  VisualizationLevel,
  MealRecommendation,
  NutritionalGoals,
} from "./types";
import { LevelSelector } from "./components/LevelSelector";
import { MealView } from "./components/MealView";
import { FoodView } from "./components/FoodView";
import { IngredientView } from "./components/IngredientView";
import { WeekSelector } from "./components/WeekSelector";
import { MealDetailsPanel } from "./components/MealDetailsPanel";
import { calculateCurrentNutritionalValues } from "./utils";
import { transformMealPlanToRecommendations } from "../../utils/mealPlanTransformer";
import {
  format,
  isSameDay,
  startOfDay,
  parseISO,
  isValid as isValidDate,
  // isToday,
} from "date-fns";
import { ArrowPathIcon, CalendarDaysIcon } from "@heroicons/react/20/solid";

// Robust date normalization
const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    console.warn(
      "Viz normalizeDate received null/undefined, returning current date."
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn(
      "Viz normalizeDate received invalid date, returning current date:",
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

type SaveMealHandler = (payload: {
  userId: string;
  date: string; // yyyy-MM-dd
  mealId: string; // originalBackendId
}) => Promise<boolean>; // Returns true on success, false on failure

// Define the type for the callback to parent for fetching
type FetchRequestHandler = (payload: {
  datesToFetch: string[]; // Only the dates that _need_ fetching
  direction: "past" | "future" | "initial" | "specific"; // Add direction
}) => void;

// Define the type for the callback to parent for date selection
type DateSelectHandler = (newDate: Date) => void;

type RegeneratePartialHandler = (dates: string[]) => void;

type DeleteMealHandler = (mealId: string, date: Date) => Promise<void>;
type FavoriteMealHandler = (mealId: string, date: Date) => Promise<void>;

interface MealCalendarVizProps {
  mealData: DayMeals[]; // This prop represents the initial/fetched trace data
  userPreferences: {
    diabetesFriendly: boolean;
    culturalPreferences: string[];
  };
  nutritionalGoals: NutritionalGoals | null; // Use the fetched goals (can be null)
  mealPlan?: any; // Raw recommendation plan from localStorage
  onRequestFetch: FetchRequestHandler;
  onDateSelect: DateSelectHandler;
  selectedDate: Date; // Controlled by parent
  onRegeneratePartial: RegeneratePartialHandler;
  isRegenerating: boolean;
  onSaveMeal: SaveMealHandler;
  onDeleteMeal: DeleteMealHandler;
  onFavoriteMeal: FavoriteMealHandler;
  userId: string;
  // New props for infinite scroll
  isFetchingPast: boolean;
  isFetchingFuture: boolean;
  loadedStartDate: Date | null;
  loadedEndDate: Date | null;
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({
  mealData: initialTraceData, // Rename prop for clarity
  nutritionalGoals,
  mealPlan,
  onRequestFetch,
  onDateSelect,
  selectedDate,
  onRegeneratePartial,
  isRegenerating,
  onSaveMeal,
  onFavoriteMeal,
  onDeleteMeal,
  userId,
  // Destructure new props
  isFetchingPast,
  isFetchingFuture,
  loadedStartDate,
  loadedEndDate,
}) => {
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State for trace data (accepted/historical meals)
  const [traceData, setTraceData] = useState<DayMeals[]>(initialTraceData);
  // State for recommendation data (derived from mealPlan)
  const [recommendationData, setRecommendationData] = useState<
    DayRecommendations[]
  >([]);
  const [currentLevel, setCurrentLevel] =
    useState<VisualizationLevel["type"]>("meal");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null); // Refers to a selected TRACE meal
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);

  const [selectedRecommendation, setSelectedRecommendation] =
    useState<MealRecommendation | null>(null); // Refers to a selected RECOMMENDED meal
  const vizRef = useRef<HTMLDivElement>(null);
  const [mealBinNames, setMealBinNames] = useState<string[]>(() => {
    // Load from localStorage on initial render
    const savedNames = localStorage.getItem("mealBinNames");
    return savedNames ? JSON.parse(savedNames) : ["Meal 1", "Meal 2", "Meal 3"];
  });
  const traceDataRef = useRef<DayMeals[]>(initialTraceData);

  // State Synchronization and Data Handling

  // Effect to update local traceData state when initialTraceData prop changes
  useEffect(() => {
    console.log("Viz: initialTraceData prop changed. Updating local state.");
    // Normalize dates in the incoming prop data
    const normalizedPropData = initialTraceData
      .map((day) => ({
        ...day,
        date: normalizeDate(day.date),
        meals: Array.isArray(day.meals)
          ? day.meals.map((meal) => ({
              ...meal,
              date: normalizeDate(day.date), // Ensure meal date matches day date
            }))
          : [],
      }))
      .filter((day) => isValidDate(day.date)); // Filter out any days with invalid dates after normalization

    // Simple approach: Directly use the normalized prop data as the source of truth for display.
    // Optimistic updates will be handled separately and merged visually if needed,
    // but the prop represents the confirmed state from the parent.
    const sortedNormalizedData = [...normalizedPropData].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Update the ref immediately
    traceDataRef.current = sortedNormalizedData;

    // Update the state if it differs from the new prop data
    // Use a deep comparison or JSON stringify (careful with functions/Date objects if not serialized properly)
    // For simplicity, let's update state if the length or first/last date differs, or use stringify
    if (JSON.stringify(sortedNormalizedData) !== JSON.stringify(traceData)) {
      console.log(
        "Viz: Updating traceData state with new normalized data from props."
      );
      setTraceData(sortedNormalizedData);
    } else {
      console.log(
        "Viz: Normalized prop data matches current traceData state. No update needed."
      );
    }
  }, [initialTraceData, traceData]); // Rerun only when the prop changes or local state changes

  const handleMealBinNamesUpdate = (newNames: string[]) => {
    setMealBinNames(newNames);
    // Optionally save to localStorage for persistence
    localStorage.setItem("mealBinNames", JSON.stringify(newNames));
  };

  // Load recommendations based on mealPlan prop (from localStorage)
  useEffect(() => {
    async function loadRecommendations() {
      // Check if mealPlan exists and has the expected structure (e.g., a 'days' property)
      if (
        mealPlan &&
        typeof mealPlan === "object" &&
        mealPlan.days &&
        Object.keys(mealPlan.days).length > 0
      ) {
        setLoadingRecommendations(true);
        setError(null);
        console.log("Viz: Transforming meal plan to recommendations...");
        try {
          // Pass the raw mealPlan and fetched nutritionalGoals to the transformer
          const transformedData = await transformMealPlanToRecommendations(
            mealPlan, // Pass the full mealPlan object from localStorage
            nutritionalGoals // Pass the fetched goals
          );

          // Normalize dates within the transformed recommendations
          const recommendations = transformedData
            .map((day) => ({
              date: normalizeDate(day.date),
              recommendations: (day.recommendations || []).map((rec) => ({
                ...rec,
                meal: {
                  ...rec.meal,
                  date: normalizeDate(day.date),
                },
              })),
            }))
            .filter((day) => isValidDate(day.date));

          console.log("Viz: Transformation complete.");
          setRecommendationData(recommendations);
        } catch (transformError) {
          console.error("Viz: Error transforming meal plan:", transformError);
          setError("Error loading recommendations from meal plan");
          setRecommendationData([]);
        } finally {
          setLoadingRecommendations(false);
        }
      } else {
        // Clear recommendations if mealPlan is missing, empty, or invalid
        if (mealPlan && Object.keys(mealPlan).length > 0 && !mealPlan.days) {
          console.warn(
            "Viz: mealPlan found in localStorage but missing 'days' property. Clearing recommendations.",
            mealPlan
          );
        } else {
          // console.log("Viz: No valid meal plan provided, clearing recommendations.");
        }
        setRecommendationData([]);
        setError(null); // Clear any previous error
        setLoadingRecommendations(false); // Ensure loading is off
      }
    }

    loadRecommendations();
    // Rerun when mealPlan changes OR when nutritionalGoals are updated
  }, [mealPlan, nutritionalGoals]);

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

  // Calculate base nutritional values from TRACE data only
  const calculateBaseNutrition = useCallback((data: DayMeals[], date: Date) => {
    const normalizedDate = normalizeDate(date); // Normalize input date
    const dayData = data.find((day) =>
      isSameNormalizedDay(day.date, normalizedDate)
    );
    return calculateCurrentNutritionalValues(dayData ? [dayData] : []);
  }, []);

  // Update base and current nutritional values
  useEffect(() => {
    // Use the ref for the most up-to-date trace data for calculation
    const baseValues = calculateBaseNutrition(
      traceDataRef.current,
      selectedDate
    );
    setBaseNutritionalValues(baseValues);

    let currentValues = { ...baseValues }; // Start with base

    // If a recommendation is selected, add its impact for simulation
    if (selectedRecommendation) {
      currentValues = {
        calories:
          baseValues.calories +
          (selectedRecommendation.nutritionalImpact?.calories || 0),
        carbs:
          baseValues.carbs +
          (selectedRecommendation.nutritionalImpact?.carbs || 0),
        protein:
          baseValues.protein +
          (selectedRecommendation.nutritionalImpact?.protein || 0),
        fiber:
          baseValues.fiber +
          (selectedRecommendation.nutritionalImpact?.fiber || 0),
      };
    }
    // Set the final current values
    setCurrentNutritionalValues(currentValues);
  }, [selectedDate, selectedRecommendation, calculateBaseNutrition, traceData]);

  // Selection Handlers
  const handleMealSelect = (meal: Meal | null) => {
    setSelectedMeal(meal); // Selects a TRACE meal
    setSelectedFood(null);
    setSelectedIngredient(null);
    setSelectedRecommendation(null); // Clear recommendation selection
  };

  const handleFoodSelect = (food: Food | null, isRecommended?: boolean) => {
    // If a recommended food is clicked, select the food AND its parent recommendation
    if (food && isRecommended) {
      const normalizedSelected = normalizeDate(selectedDate);
      const dayRecs = recommendationData.find((day) =>
        isSameNormalizedDay(day.date, normalizedSelected)
      );
      const parentRecommendation = dayRecs?.recommendations.find((rec) =>
        rec.meal.foods.some((f) => f.id === food.id)
      );
      setSelectedFood(food);
      setSelectedRecommendation(parentRecommendation || null);
      setSelectedMeal(null);
      setSelectedIngredient(null);
      if (!parentRecommendation) {
        console.warn("Could not find parent recommendation for food:", food.id);
      }
    } else {
      // Selecting a trace food or deselecting
      setSelectedFood(food);
      setSelectedMeal(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);
    }
  };

  const handleIngredientSelect = (
    ingredient: Ingredient | null,
    isRecommended?: boolean
  ) => {
    // If a recommended ingredient is clicked, select the ingredient AND its parent recommendation
    if (ingredient && isRecommended) {
      const dayRecs = recommendationData.find((day) =>
        isSameNormalizedDay(day.date, selectedDate)
      );
      const parentRecommendation = dayRecs?.recommendations.find((rec) =>
        rec.meal.foods.some((food) =>
          food.ingredients.some(
            (ing) =>
              (ing.id && ing.id === ingredient.id) ||
              (!ing.id && !ingredient.id && ing.name === ingredient.name)
          )
        )
      );
      setSelectedIngredient(ingredient);
      setSelectedRecommendation(parentRecommendation || null);
      setSelectedMeal(null);
      setSelectedFood(null);
      if (!parentRecommendation) {
        console.warn(
          "Could not find parent recommendation for ingredient:",
          ingredient.id || ingredient.name
        );
      }
    } else {
      setSelectedIngredient(ingredient);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedRecommendation(null);
    }
  };

  const handleRecommendationSelect = (
    recommendation: MealRecommendation | null
  ) => {
    setSelectedRecommendation(recommendation);
    setSelectedMeal(null);
    setSelectedFood(null);
    setSelectedIngredient(null);
  };

  // Accept Recommendation Handler
  const handleAcceptRecommendation = useCallback(
    async (acceptedRec: MealRecommendation) => {
      const confirmAccept = window.confirm(
        `Add "${acceptedRec.meal.name}" to your meal history for ${format(
          acceptedRec.meal.date || selectedDate,
          "MMM d"
        )}? This action saves the meal.`
      );
      if (!confirmAccept) return;

      const acceptedMeal = acceptedRec.meal;
      const backendIdToSave = acceptedMeal.originalBackendId;
      const mealDate = normalizeDate(acceptedMeal.date || selectedDate);
      const mealDateStr = format(mealDate, "yyyy-MM-dd");

      if (!backendIdToSave || !userId) {
        alert(
          "Error: Cannot accept recommendation due to missing internal ID or user info."
        );
        return;
      }

      // 1. Optimistic UI Update (Trace Data)
      const traceMealToAdd: Meal = {
        ...acceptedMeal,
        id: `trace-optimistic-${acceptedMeal.id}-${Date.now()}`,
        date: mealDate,
      };
      delete traceMealToAdd.originalBackendId;

      setTraceData((prevTraceData) => {
        const newData = [...prevTraceData];
        const dayIndex = newData.findIndex((day) =>
          isSameNormalizedDay(day.date, mealDate)
        );
        if (dayIndex > -1) {
          newData[dayIndex] = {
            ...newData[dayIndex],
            date: mealDate,
            meals: [...(newData[dayIndex].meals || []), traceMealToAdd].sort(
              (a, b) => a.time.localeCompare(b.time)
            ),
          };
        } else {
          newData.push({ date: mealDate, meals: [traceMealToAdd] });
        }
        const sortedData = newData.sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );
        traceDataRef.current = sortedData; // Update ref
        return sortedData;
      });

      // 2. Optimistic UI Update (Recommendation Data)
      const originalRecommendationData = recommendationData;
      setRecommendationData((prevRecData) => {
        const updatedRecData = prevRecData
          .map((dayRec) => {
            if (isSameNormalizedDay(dayRec.date, mealDate)) {
              return {
                ...dayRec,
                date: normalizeDate(dayRec.date),
                recommendations: dayRec.recommendations.filter(
                  (rec) => rec.meal.id !== acceptedRec.meal.id
                ),
              };
            }
            return { ...dayRec, date: normalizeDate(dayRec.date) };
          })
          .filter((dayRec) => dayRec.recommendations.length > 0);
        return updatedRecData;
      });

      // 3. Clear Selections
      setSelectedRecommendation(null);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);

      // 4. Call Backend
      try {
        const saveSuccess = await onSaveMeal({
          userId,
          date: mealDateStr,
          mealId: backendIdToSave,
        });
        if (saveSuccess) {
          // 5. Update localStorage (on success)
          try {
            const rawMealPlanString = localStorage.getItem("mealPlan");
            if (rawMealPlanString) {
              let rawMealPlan = JSON.parse(rawMealPlanString);
              let changed = false;
              if (
                rawMealPlan.days &&
                rawMealPlan.days[mealDateStr] &&
                Array.isArray(rawMealPlan.days[mealDateStr].meals)
              ) {
                const initialLength =
                  rawMealPlan.days[mealDateStr].meals.length;
                rawMealPlan.days[mealDateStr].meals = rawMealPlan.days[
                  mealDateStr
                ].meals.filter(
                  (rawMeal: any) => rawMeal._id !== backendIdToSave
                );
                const finalLength = rawMealPlan.days[mealDateStr].meals.length;
                if (finalLength < initialLength) {
                  changed = true;
                  if (
                    finalLength === 0 &&
                    Object.keys(rawMealPlan.days[mealDateStr]).length <= 3
                  ) {
                    delete rawMealPlan.days[mealDateStr];
                  }
                }
              }
              if (changed) {
                localStorage.setItem("mealPlan", JSON.stringify(rawMealPlan));
              }
            }
          } catch (e) {
            console.error(
              "Viz: Failed to update localStorage['mealPlan'] after save:",
              e
            );
          }

          // 6. Trigger Re-fetch
          onRequestFetch({
            datesToFetch: [mealDateStr],
            direction: "specific",
          });
        } else {
          // Revert UI on Save Failure
          console.error(
            `Viz: onSaveMeal failed for meal ${backendIdToSave}. Reverting UI.`
          );
          alert("Failed to save the meal. Recommendation restored.");
          setTraceData((prevTraceData) => {
            const revertedData = prevTraceData
              .map((day) => {
                if (isSameNormalizedDay(day.date, mealDate)) {
                  return {
                    ...day,
                    meals: day.meals.filter((m) => m.id !== traceMealToAdd.id),
                  };
                }
                return day;
              })
              .filter(
                (day) =>
                  !(
                    day.meals.length === 0 &&
                    !originalRecommendationData.find((d) =>
                      isSameNormalizedDay(d.date, day.date)
                    )?.recommendations.length
                  )
              );
            traceDataRef.current = revertedData; // Update ref
            return revertedData;
          });
          setRecommendationData(originalRecommendationData);
        }
      } catch (error) {
        // Revert UI on Save Error (Exception)
        console.error("Viz: Error during onSaveMeal call:", error);
        alert("An error occurred while saving. Recommendation restored.");
        setTraceData((prevTraceData) => {
          const revertedData = prevTraceData
            .map((day) => {
              if (isSameNormalizedDay(day.date, mealDate)) {
                return {
                  ...day,
                  meals: day.meals.filter((m) => m.id !== traceMealToAdd.id),
                };
              }
              return day;
            })
            .filter(
              (day) =>
                !(
                  day.meals.length === 0 &&
                  !originalRecommendationData.find((d) =>
                    isSameNormalizedDay(d.date, day.date)
                  )?.recommendations.length
                )
            );
          traceDataRef.current = revertedData; // Update ref
          return revertedData;
        });
        setRecommendationData(originalRecommendationData);
      }
    },
    [
      selectedDate,
      userId,
      recommendationData,
      onSaveMeal,
      onRequestFetch,
      setTraceData,
      setRecommendationData,
      setSelectedRecommendation,
      setSelectedMeal,
      setSelectedFood,
      setSelectedIngredient,
    ]
  );

  // Reject Recommendation Handler
  const handleRejectRecommendation = useCallback(
    (rejectedRec: MealRecommendation) => {
      const confirmReject = window.confirm(
        `Reject recommendation "${rejectedRec.meal.name}" for ${format(
          rejectedRec.meal.date || selectedDate,
          "MMM d"
        )}?`
      );
      if (!confirmReject) return;

      const rejectedMeal = rejectedRec.meal;
      const backendIdToRemove = rejectedMeal.originalBackendId;
      const mealDate = normalizeDate(rejectedMeal.date || selectedDate);
      const mealDateStr = format(mealDate, "yyyy-MM-dd");

      if (!backendIdToRemove) {
        alert(
          "Error: Could not reject recommendation due to missing internal ID."
        );
        return;
      }

      // 1. Optimistic UI Update (Recommendation Data)
      setRecommendationData((prevRecData) => {
        const updatedRecData = prevRecData
          .map((dayRec) => {
            if (isSameNormalizedDay(dayRec.date, mealDate)) {
              return {
                ...dayRec,
                date: normalizeDate(dayRec.date),
                recommendations: dayRec.recommendations.filter(
                  (rec) => rec.meal.id !== rejectedRec.meal.id
                ),
              };
            }
            return { ...dayRec, date: normalizeDate(dayRec.date) };
          })
          .filter((dayRec) => dayRec.recommendations.length > 0);
        return updatedRecData;
      });

      // 2. Update localStorage
      try {
        const rawMealPlanString = localStorage.getItem("mealPlan");
        if (rawMealPlanString) {
          let rawMealPlan = JSON.parse(rawMealPlanString);
          let changed = false;
          if (
            rawMealPlan.days &&
            rawMealPlan.days[mealDateStr] &&
            Array.isArray(rawMealPlan.days[mealDateStr].meals)
          ) {
            const initialLength = rawMealPlan.days[mealDateStr].meals.length;
            rawMealPlan.days[mealDateStr].meals = rawMealPlan.days[
              mealDateStr
            ].meals.filter((rawMeal: any) => rawMeal._id !== backendIdToRemove);
            const finalLength = rawMealPlan.days[mealDateStr].meals.length;
            if (finalLength < initialLength) {
              changed = true;
              if (finalLength === 0) {
                delete rawMealPlan.days[mealDateStr];
              }
            }
          }
          if (changed) {
            localStorage.setItem("mealPlan", JSON.stringify(rawMealPlan));
          }
        }
      } catch (e) {
        console.error(
          "Viz: Failed to update localStorage['mealPlan'] during rejection:",
          e
        );
      }

      // 3. Clear Selections if needed
      if (selectedRecommendation?.meal.id === rejectedRec.meal.id) {
        setSelectedRecommendation(null);
        setSelectedMeal(null);
        setSelectedFood(null);
        setSelectedIngredient(null);
      }
    },
    [
      selectedDate,
      setRecommendationData,
      selectedRecommendation,
      setSelectedRecommendation,
      setSelectedMeal,
      setSelectedFood,
      setSelectedIngredient,
    ]
  );

  // Event Handlers for User Interaction

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vizRef.current && !vizRef.current.contains(event.target as Node)) {
        if (
          !(event.target as HTMLElement).closest(
            ".meal-details-panel-container"
          ) &&
          // Prevent closing when clicking MUI DatePicker elements
          !(event.target as HTMLElement).closest(".MuiPopover-root") &&
          !(event.target as HTMLElement).closest(".MuiDialog-root")
        ) {
          setSelectedRecommendation(null);
          setSelectedMeal(null);
          setSelectedFood(null);
          setSelectedIngredient(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMainAreaClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const isBackgroundClick =
      target.classList.contains("meal-view-background") ||
      target.classList.contains("food-view-background") ||
      target.classList.contains("ingredient-view-background") ||
      target.classList.contains("viz-main-area");
    const isInteractiveElementClick = target.closest(
      ".meal-card, .recommendation-card, .level-selector, button, .food-card-item, .ingredient-card-item, .week-selector-container, input[type='date'], .meal-details-panel-container, .MuiInputBase-root, .MuiButtonBase-root"
    );
    if (isBackgroundClick || !isInteractiveElementClick) {
      setSelectedRecommendation(null);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
    }
  };

  // Event Handlers for UI Controls
  const handleDateChange = useCallback(
    (newDateInput: Date) => {
      const newDate = normalizeDate(newDateInput);
      onDateSelect(newDate); // Propagate date change to parent
    },
    [onDateSelect]
  );

  // --- New handler for "Today" button ---
  const handleGoToToday = useCallback(() => {
    const today = normalizeDate(new Date());
    handleDateChange(today); // Reuse existing logic to update date and trigger scroll
  }, [handleDateChange]);
  // --- End new handler ---

  const handleLevelChange = useCallback(
    (newLevel: VisualizationLevel["type"]) => {
      setCurrentLevel(newLevel);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);
      onDateSelect(normalizeDate(new Date()));
    },
    [onDateSelect]
  );

  const hasRecommendationsInView = recommendationData.some(
    (dayRec) => dayRec.recommendations.length > 0
  );

  const handleRegenerateClick = useCallback(() => {
    if (isRegenerating || !hasRecommendationsInView) return;
    const datesWithRecsSet = new Set<string>();
    recommendationData.forEach((dayRec) => {
      if (dayRec.recommendations && dayRec.recommendations.length > 0) {
        const normalizedDate = normalizeDate(dayRec.date);
        if (isValidDate(normalizedDate)) {
          datesWithRecsSet.add(format(normalizedDate, "yyyy-MM-dd"));
        }
      }
    });
    const datesToRegenerate = Array.from(datesWithRecsSet);
    if (datesToRegenerate.length === 0) return;
    onRegeneratePartial(datesToRegenerate);
  }, [
    recommendationData,
    onRegeneratePartial,
    isRegenerating,
    hasRecommendationsInView,
  ]);

  // Rendering
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <p>Error in Visualization: {error}</p>
      </div>
    );
  }

  const defaultGoals: NutritionalGoals = {
    dailyCalories: 2000,
    carbohydrates: { daily: 250, unit: "g" },
    protein: { daily: 100, unit: "g" },
    fiber: { daily: 30, unit: "g" },
  };
  const goalsToDisplay = nutritionalGoals || defaultGoals;

  const regenerateButtonTooltip = isRegenerating
    ? "Regenerating..."
    : !hasRecommendationsInView
    ? "No recommendations to regenerate"
    : "Regenerate all current recommendations";

  return (
    <div
      className="w-screen flex flex-col overflow-hidden bg-gray-100"
      ref={vizRef}
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Main Content */}
      <div className="w-full h-full flex flex-col overflow-hidden box-border">
        {/* Center Calendar View */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">
          {/* Level Selector Bar */}
          <div className="w-full h-16 px-4 bg-white border-b shadow-sm z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LevelSelector
                currentLevel={currentLevel}
                onLevelChange={handleLevelChange}
              />
              <button
                onClick={handleRegenerateClick}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center transition-colors duration-200
                  ${
                    isRegenerating || !hasRecommendationsInView
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }
                `}
                disabled={isRegenerating || !hasRecommendationsInView}
                title={regenerateButtonTooltip}
              >
                {isRegenerating ? (
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                )}
                {isRegenerating ? "Regenerating..." : "Regenerate Plans"}
              </button>
            </div>
            {/* --- Week Selector and Today Button --- */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 rounded-md text-sm flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                title="Go to Today"
              >
                <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
                Today
              </button>
              <div className="week-selector-container">
                <WeekSelector
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>
            {/* --- End Week Selector and Today Button --- */}
          </div>
          {/* Main Visualization Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Calendar View */}
            <div className="flex-1 min-w-0 p-4 flex flex-col">
              <div
                className="viz-main-area bg-white rounded-lg shadow-sm flex-1 overflow-hidden border border-gray-200 flex flex-col"
                onClick={handleMainAreaClick}
              >
                {/* Add background divs for better click target detection */}
                {currentLevel === "meal" && (
                  <div className="meal-view-background h-full">
                    <MealView
                      allData={traceData} // Pass full trace data
                      recommendationData={recommendationData} // Pass full rec data
                      selectedDate={selectedDate}
                      onMealSelect={handleMealSelect}
                      selectedMeal={selectedMeal}
                      onRecommendationSelect={handleRecommendationSelect}
                      onAcceptRecommendationClick={handleAcceptRecommendation}
                      onRejectRecommendationClick={handleRejectRecommendation}
                      onFavoriteMealClick={onFavoriteMeal}
                      onDeleteMealClick={onDeleteMeal}
                      selectedRecommendation={selectedRecommendation}
                      mealBinNames={mealBinNames}
                      onMealBinUpdate={handleMealBinNamesUpdate}
                      isLoading={loadingRecommendations}
                      // Pass infinite scroll props
                      onRequestFetch={onRequestFetch}
                      isFetchingPast={isFetchingPast}
                      isFetchingFuture={isFetchingFuture}
                      loadedStartDate={loadedStartDate}
                      loadedEndDate={loadedEndDate}
                      scrollToDate={selectedDate}
                    />
                  </div>
                )}
                {currentLevel === "food" && (
                  <div className="food-view-background h-full">
                    {/* Pass infinite scroll props to FoodView */}
                    <FoodView
                      allData={traceData} // Pass full trace data
                      recommendationData={recommendationData}
                      onFoodSelect={handleFoodSelect}
                      selectedFood={selectedFood}
                      mealBinNames={mealBinNames}
                      onMealBinUpdate={handleMealBinNamesUpdate}
                      selectedRecommendation={selectedRecommendation}
                      selectedDate={selectedDate}
                      // Pass infinite scroll props
                      onRequestFetch={onRequestFetch}
                      isFetchingPast={isFetchingPast}
                      isFetchingFuture={isFetchingFuture}
                      loadedStartDate={loadedStartDate}
                      loadedEndDate={loadedEndDate}
                      scrollToDate={selectedDate}
                    />
                  </div>
                )}
                {currentLevel === "ingredient" && (
                  <div className="ingredient-view-background h-full">
                    {/* Pass infinite scroll props to IngredientView */}
                    <IngredientView
                      allData={traceData} // Pass full trace data
                      recommendationData={recommendationData}
                      onIngredientSelect={handleIngredientSelect}
                      selectedIngredient={selectedIngredient}
                      mealBinNames={mealBinNames}
                      onMealBinUpdate={handleMealBinNamesUpdate}
                      selectedRecommendation={selectedRecommendation}
                      selectedDate={selectedDate}
                      // Pass infinite scroll props
                      onRequestFetch={onRequestFetch}
                      isFetchingPast={isFetchingPast}
                      isFetchingFuture={isFetchingFuture}
                      loadedStartDate={loadedStartDate}
                      loadedEndDate={loadedEndDate}
                      scrollToDate={selectedDate}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
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
                  setSelectedRecommendation(null);
                }}
                nutritionalGoals={goalsToDisplay}
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

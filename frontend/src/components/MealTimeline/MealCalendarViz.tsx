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
  subDays,
  addDays,
  format,
  eachDayOfInterval,
  isSameDay,
  startOfDay,
  parseISO,
  isValid as isValidDate,
} from "date-fns";
import { ArrowPathIcon } from "@heroicons/react/20/solid";

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

// Define the type for the callback to parent for fetching
type FetchRequestHandler = (payload: {
  datesToFetch: string[]; // Only the dates that *need* fetching
}) => void;

// Define the type for the callback to parent for date selection
type DateSelectHandler = (newDate: Date) => void;

type RegeneratePartialHandler = (dates: string[]) => void;

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

  // --- State Synchronization and Data Handling ---

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

  // --- Selection Handlers ---
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

      // Set both the food and its parent recommendation context
      setSelectedFood(food);
      setSelectedRecommendation(parentRecommendation || null); // Set parent rec, or null if not found
      setSelectedMeal(null); // Clear other selections
      setSelectedIngredient(null); // Clear other selections

      if (!parentRecommendation) {
        console.warn(
          "Could not find parent recommendation for recommended food:",
          food.id
        );
      }
    } else {
      // Selecting a trace food or deselecting
      setSelectedFood(food);
      setSelectedMeal(null); // Clear meal selection
      setSelectedIngredient(null); // Clear ingredient selection
      setSelectedRecommendation(null); // Clear recommendation selection
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
              (ing.id && ing.id === ingredient.id) || // Match by ID if available
              (!ing.id && !ingredient.id && ing.name === ingredient.name) // Fallback to name match
          )
        )
      );

      // Set both the ingredient and its parent recommendation context
      setSelectedIngredient(ingredient);
      setSelectedRecommendation(parentRecommendation || null); // Set parent rec, or null if not found
      setSelectedMeal(null); // Clear other selections
      setSelectedFood(null); // Clear other selections

      if (!parentRecommendation) {
        console.warn(
          "Could not find parent recommendation for recommended ingredient:",
          ingredient.id || ingredient.name
        );
      }
    } else {
      // Selecting a trace ingredient or deselecting
      setSelectedIngredient(ingredient);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedRecommendation(null); // Clear recommendation selection
    }
  };

  // handleRecommendationSelect remains the same
  const handleRecommendationSelect = (
    recommendation: MealRecommendation | null
  ) => {
    setSelectedRecommendation(recommendation); // Selects a RECOMMENDED meal
    // Clear specific trace selections when a recommendation is selected
    setSelectedMeal(null);
    setSelectedFood(null);
    setSelectedIngredient(null);
    // Nutritional values update via useEffect dependency
  };

  // --- Accept Recommendation Handler ---
  const handleAcceptRecommendation = useCallback(
    (acceptedRec: MealRecommendation) => {
      const confirmAccept = window.confirm(
        `Add "${acceptedRec.meal.name}" to your meal history for ${format(
          acceptedRec.meal.date || selectedDate,
          "MMM d"
        )}? This action saves the meal.`
      );
      if (!confirmAccept) {
        console.log("Viz: Acceptance cancelled by user.");
        return; // Stop if user cancels
      }

      console.log(
        "Viz: Accepting recommendation:",
        acceptedRec.meal.name,
        "ID:",
        acceptedRec.meal.id
      );
      const acceptedMeal = acceptedRec.meal;
      const backendIdToRemove = acceptedMeal.originalBackendId; // ID of the recommendation *source*
      const mealDate = normalizeDate(acceptedMeal.date || selectedDate); // Ensure date is normalized
      const mealDateStr = format(mealDate, "yyyy-MM-dd");

      console.log(
        `Viz: Accepting recommendation: Name='${acceptedMeal.name}', ID='${acceptedMeal.id}', OriginalBackendID='${backendIdToRemove}', Date='${mealDateStr}'`
      );

      if (!backendIdToRemove) {
        console.error(
          "Viz: CRITICAL - Cannot process acceptance. originalBackendId is missing:",
          acceptedRec
        );
        alert(
          "Error: Could not accept recommendation due to missing internal ID."
        );
        return;
      }

      // 1. Optimistic UI Update for Trace Data (using setTraceData and traceDataRef)
      const traceMealToAdd: Meal = {
        ...acceptedMeal,
        id: `trace-${acceptedMeal.id}-${Date.now()}`, // Create a unique ID for the trace version
        date: mealDate, // Assign the correct normalized date
        // Ensure originalBackendId is NOT copied to the trace meal unless specifically needed
        // originalBackendId: undefined, // Or remove the property
      };
      // Remove originalBackendId if it exists on traceMealToAdd
      delete traceMealToAdd.originalBackendId;

      setTraceData((prevTraceData) => {
        const newData = [...prevTraceData];
        const dayIndex = newData.findIndex((day) =>
          isSameNormalizedDay(day.date, mealDate)
        );

        if (dayIndex > -1) {
          // Add to existing day
          newData[dayIndex] = {
            ...newData[dayIndex],
            date: mealDate, // Ensure date is normalized
            meals: [...(newData[dayIndex].meals || []), traceMealToAdd].sort(
              (a, b) => a.time.localeCompare(b.time)
            ), // Sort meals by time
          };
          console.log(
            `Viz: Optimistically added meal '${traceMealToAdd.id}' to existing day ${mealDateStr} in traceData state.`
          );
        } else {
          // Add new day
          newData.push({ date: mealDate, meals: [traceMealToAdd] });
          console.log(
            `Viz: Optimistically created new day ${mealDateStr} in traceData state for meal '${traceMealToAdd.id}'.`
          );
        }
        // Sort and update ref
        const sortedData = newData.sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );
        traceDataRef.current = sortedData; // Update ref immediately
        return sortedData;
      });

      // 2. Optimistic Update for Recommendation Data State (Remove the accepted one)
      setRecommendationData((prevRecData) => {
        const updatedRecData = prevRecData
          .map((dayRec) => {
            if (isSameNormalizedDay(dayRec.date, mealDate)) {
              return {
                ...dayRec,
                date: normalizeDate(dayRec.date), // Ensure date is normalized
                recommendations: dayRec.recommendations.filter(
                  (rec) => rec.meal.id !== acceptedRec.meal.id // Filter by the recommendation's unique meal ID
                ),
              };
            }
            return { ...dayRec, date: normalizeDate(dayRec.date) }; // Ensure date is normalized
          })
          .filter((dayRec) => dayRec.recommendations.length > 0); // Remove day if no recommendations left
        console.log(
          "Viz: Optimistically updated recommendationData state (removed accepted visual)."
        );
        return updatedRecData;
      });

      // 3. Update localStorage["mealPlan"] (Remove the source recommendation)
      try {
        const rawMealPlanString = localStorage.getItem("mealPlan");
        if (rawMealPlanString) {
          let rawMealPlan = JSON.parse(rawMealPlanString);
          let changed = false;
          if (
            rawMealPlan.days &&
            rawMealPlan.days[mealDateStr] &&
            Array.isArray(rawMealPlan.days[mealDateStr].meals) // Check if meals is an array
          ) {
            const initialLength = rawMealPlan.days[mealDateStr].meals.length;
            // Filter out the meal using the originalBackendId
            rawMealPlan.days[mealDateStr].meals = rawMealPlan.days[
              mealDateStr
            ].meals.filter((rawMeal: any) => rawMeal._id !== backendIdToRemove);
            const finalLength = rawMealPlan.days[mealDateStr].meals.length;

            if (finalLength < initialLength) {
              changed = true;
              console.log(
                `Viz: Removed raw meal with _id '${backendIdToRemove}' from localStorage["mealPlan"] for date ${mealDateStr}.`
              );
              // If the day becomes empty, remove the day entry
              if (
                finalLength === 0 &&
                Object.keys(rawMealPlan.days[mealDateStr]).length <= 3
              ) {
                // Check if only _id, user_id, meal_plan_id remain
                console.log(
                  `Viz: Removing empty day ${mealDateStr} from localStorage["mealPlan"].`
                );
                delete rawMealPlan.days[mealDateStr];
              }
            } else {
              console.warn(
                `Viz: Did not find raw meal with _id '${backendIdToRemove}' in localStorage["mealPlan"] for date ${mealDateStr} to remove.`
              );
            }
          } else {
            console.warn(
              `Viz: Could not find day ${mealDateStr} or its meals array in localStorage["mealPlan"] for removal.`
            );
          }

          if (changed) {
            // If all days are gone, remove the mealPlan entirely? Or keep the structure? Keep structure for now.
            if (Object.keys(rawMealPlan.days).length === 0) {
              console.log(
                "Viz: No days left in mealPlan, but keeping structure in localStorage."
              );
              // Optionally: localStorage.removeItem("mealPlan");
            }
            localStorage.setItem("mealPlan", JSON.stringify(rawMealPlan));
            // Object.keys(sessionStorage).forEach((key) => {
            //   if (key.startsWith("recommendations-"))
            //     sessionStorage.removeItem(key);
            // });
            console.log(
              "Viz: Updated localStorage['mealPlan'] after acceptance."
            );
          }
        } else {
          console.warn(
            "Viz: localStorage['mealPlan'] not found, cannot remove accepted meal source."
          );
        }
      } catch (e) {
        console.error(
          "Viz: Failed to update localStorage['mealPlan'] during acceptance:",
          e
        );
      }

      // 4. Clear Selections
      setSelectedRecommendation(null);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);

      // 5. Trigger Re-fetch for Persistence (Tell parent to confirm the state)
      // This is crucial. The parent will fetch, get the updated data (including the newly added meal),
      // and pass it back down via initialTraceData, replacing the optimistic update with confirmed data.
      console.log(
        "Viz: Requesting parent fetch to confirm acceptance for date:",
        mealDateStr
      );
      // We only need to fetch the specific day that was modified
      onRequestFetch({ datesToFetch: [mealDateStr] });

      console.log("Viz: Recommendation acceptance processing finished.");
    },
    [
      selectedDate,
      setTraceData,
      setRecommendationData,
      setSelectedRecommendation,
      setSelectedMeal,
      setSelectedFood,
      setSelectedIngredient,
      onRequestFetch,
    ]
  );

  // Reject Recommendation Handler
  const handleRejectRecommendation = useCallback(
    (rejectedRec: MealRecommendation) => {
      console.log(
        "Viz: handleRejectRecommendation invoked for:",
        rejectedRec.meal.name,
        rejectedRec.meal.id
      );

      const confirmReject = window.confirm(
        `Are you sure you want to reject the recommendation "${
          rejectedRec.meal.name
        }" for ${format(
          rejectedRec.meal.date || selectedDate,
          "MMM d"
        )}? This recommendation will be permanently removed.`
      );

      if (!confirmReject) {
        console.log("Viz: Rejection cancelled by user.");
        return; // Stop if user cancels
      }

      console.log(
        "Viz: Rejecting recommendation:",
        rejectedRec.meal.name,
        "ID:",
        rejectedRec.meal.id
      );
      const rejectedMeal = rejectedRec.meal;
      const backendIdToRemove = rejectedMeal.originalBackendId;
      const mealDate = normalizeDate(rejectedMeal.date || selectedDate);
      const mealDateStr = format(mealDate, "yyyy-MM-dd");

      console.log(
        `Viz: Rejecting recommendation: Name='${rejectedMeal.name}', ID='${rejectedMeal.id}', OriginalBackendID='${backendIdToRemove}', Date='${mealDateStr}'`
      );

      if (!backendIdToRemove) {
        console.error(
          "Viz: CRITICAL - Cannot process rejection. originalBackendId is missing:",
          rejectedRec
        );
        alert(
          "Error: Could not reject recommendation due to missing internal ID."
        );
        return;
      }

      // 1. Optimistic Update Recommendation Data State (Remove visually)
      setRecommendationData((prevRecData) => {
        const updatedRecData = prevRecData
          .map((dayRec) => {
            if (isSameNormalizedDay(dayRec.date, mealDate)) {
              return {
                ...dayRec,
                date: normalizeDate(dayRec.date),
                recommendations: dayRec.recommendations.filter(
                  (rec) => rec.meal.id !== rejectedRec.meal.id // Filter by unique recommendation meal ID
                ),
              };
            }
            return { ...dayRec, date: normalizeDate(dayRec.date) };
          })
          .filter((dayRec) => dayRec.recommendations.length > 0); // Remove day if no recommendations left
        console.log(
          "Viz: Optimistically updated recommendationData state (removed rejected visual)."
        );

        return updatedRecData;
      });

      // 2. Update localStorage["mealPlan"] (Remove permanently)
      try {
        const rawMealPlanString = localStorage.getItem("mealPlan");
        if (rawMealPlanString) {
          let rawMealPlan = JSON.parse(rawMealPlanString);
          let changed = false;

          if (
            rawMealPlan.days &&
            rawMealPlan.days[mealDateStr] &&
            Array.isArray(rawMealPlan.days[mealDateStr].meals) // Check array
          ) {
            const initialLength = rawMealPlan.days[mealDateStr].meals.length;
            // Filter using the originalBackendId
            rawMealPlan.days[mealDateStr].meals = rawMealPlan.days[
              mealDateStr
            ].meals.filter((rawMeal: any) => rawMeal._id !== backendIdToRemove);
            const finalLength = rawMealPlan.days[mealDateStr].meals.length;

            if (finalLength < initialLength) {
              console.log(
                `Viz: Removed raw meal with _id '${backendIdToRemove}' from localStorage["mealPlan"] for date ${mealDateStr} due to rejection.`
              );
              changed = true;
              // If the day becomes empty after removal, delete the day entry
              if (finalLength === 0) {
                console.log(
                  `Viz: Removing empty day ${mealDateStr} from localStorage["mealPlan"] after rejection.`
                );
                delete rawMealPlan.days[mealDateStr];
              }
            } else {
              console.warn(
                `Viz: Did not find raw meal with _id '${backendIdToRemove}' in localStorage["mealPlan"] for date ${mealDateStr} to remove upon rejection.`
              );
            }
          } else {
            console.warn(
              `Viz: Could not find day ${mealDateStr} or its meals array in localStorage["mealPlan"] for rejection removal.`
            );
          }

          if (changed) {
            if (Object.keys(rawMealPlan.days).length === 0) {
              console.log(
                "Viz: No days left in mealPlan, but keeping structure in localStorage."
              );
              // Optionally: localStorage.removeItem("mealPlan");
            }
            localStorage.setItem("mealPlan", JSON.stringify(rawMealPlan));
            console.log(
              "Viz: Updated localStorage['mealPlan'] after rejection."
            );

            // // Clear recommendation cache as the source has changed
            // Object.keys(sessionStorage).forEach((key) => {
            //   if (key.startsWith("recommendations-")) {
            //     sessionStorage.removeItem(key);
            //   }
            // });
            // console.log(
            //   "Viz: Cleared all sessionStorage recommendation caches after rejection."
            // );
          }
        } else {
          console.warn(
            "Viz: localStorage['mealPlan'] not found, cannot remove rejected meal source."
          );
        }
      } catch (e) {
        console.error(
          "Viz: Failed to update localStorage['mealPlan'] during rejection:",
          e
        );
      }

      // 3. Clear Selections if the rejected item was selected
      if (selectedRecommendation?.meal.id === rejectedRec.meal.id) {
        setSelectedRecommendation(null);
        setSelectedMeal(null);
        setSelectedFood(null);
        setSelectedIngredient(null);
      }

      console.log("Viz: Recommendation rejection processing finished.");
    },
    [
      selectedDate,
      // recommendationData,
      setRecommendationData,
      selectedRecommendation,
      setSelectedRecommendation,
      setSelectedMeal,
      setSelectedFood,
      setSelectedIngredient,
    ]
  );

  // --- Event Handlers for User Interaction ---

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vizRef.current && !vizRef.current.contains(event.target as Node)) {
        if (
          !(event.target as HTMLElement).closest(
            ".meal-details-panel-container"
          )
        ) {
          setSelectedRecommendation(null);
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
  }, []);

  const handleMainAreaClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    // Check if the click was directly on the background elements
    const isBackgroundClick =
      target.classList.contains("meal-view-background") ||
      target.classList.contains("food-view-background") ||
      target.classList.contains("ingredient-view-background") ||
      target.classList.contains("viz-main-area");

    // Check if the click was inside a known interactive element that handles its own selection
    const isInteractiveElementClick = target.closest(
      ".meal-card, .recommendation-card, .level-selector, button, .food-card-item, .ingredient-card-item, .week-selector-container, input[type='date'], .meal-details-panel-container"
    );

    // Deselect only if the click was on the background OR if it wasn't inside any known interactive element
    if (isBackgroundClick || !isInteractiveElementClick) {
      // console.log("Viz: Deselecting due to background/non-interactive click.");
      setSelectedRecommendation(null);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
    }
    // else {
    //   console.log(
    //     "Viz: Click was on an interactive element or panel, not deselecting.",
    //     target
    //   );
    // }
  };

  // Data Fetch Triggering Logic

  const getRequiredRange = useCallback(
    (level: VisualizationLevel["type"], date: Date) => {
      const normalizedDate = normalizeDate(date); // Normalize input date
      let requiredStartDate: Date;
      let requiredEndDate: Date;
      switch (level) {
        case "meal":
          requiredStartDate = subDays(normalizedDate, 3);
          requiredEndDate = addDays(normalizedDate, 3);
          break;
        case "food":
          requiredStartDate = subDays(normalizedDate, 1);
          requiredEndDate = addDays(normalizedDate, 1);
          break;
        case "ingredient":
        default:
          requiredStartDate = normalizedDate;
          requiredEndDate = normalizedDate;
          break;
      }
      return { requiredStartDate, requiredEndDate };
    },
    []
  );

  // Effect to check for missing data when level or selectedDate prop changes
  useEffect(() => {
    const normalizedSelected = normalizeDate(selectedDate);
    if (isNaN(normalizedSelected.getTime())) {
      console.error(
        "Viz Fetch Check: Invalid selectedDate, skipping fetch check."
      );
      return;
    }

    console.log(
      `Viz Effect: Checking fetch for level=${currentLevel}, date=${format(
        normalizedSelected, // Use normalized date
        "yyyy-MM-dd"
      )}`
    );

    const { requiredStartDate, requiredEndDate } = getRequiredRange(
      currentLevel,
      normalizedSelected // Use normalized date
    );

    // Ensure start/end dates are valid before creating interval
    if (
      !isValidDate(requiredStartDate) ||
      !isValidDate(requiredEndDate) ||
      requiredStartDate > requiredEndDate
    ) {
      console.error(
        "Viz Fetch Check: Invalid date range calculated, skipping fetch check.",
        { requiredStartDate, requiredEndDate }
      );
      return;
    }

    const requiredDates = eachDayOfInterval({
      start: requiredStartDate,
      end: requiredEndDate,
    });

    // Use the ref for the most current representation of loaded data
    const currentLoadedData = traceDataRef.current;
    const existingDates = new Set(
      currentLoadedData
        .map((day) => {
          const normalizedDayDate = normalizeDate(day.date); // Normalize date from data
          return isValidDate(normalizedDayDate)
            ? format(normalizedDayDate, "yyyy-MM-dd")
            : null;
        })
        .filter((dateStr): dateStr is string => dateStr !== null) // Type guard
    );

    const missingDateStrings = requiredDates
      .map((date) => format(normalizeDate(date), "yyyy-MM-dd")) // Normalize required dates
      .filter((dateStr) => !existingDates.has(dateStr));

    if (missingDateStrings.length > 0) {
      console.log(
        "Viz Effect: Requesting fetch for missing dates:",
        missingDateStrings
      );
      onRequestFetch({
        datesToFetch: missingDateStrings,
      });
    } else {
      console.log(
        "Viz Effect: All required dates appear loaded according to traceDataRef. No fetch request needed."
      );
    }
  }, [currentLevel, selectedDate, getRequiredRange, onRequestFetch]);

  // --- Event Handlers for UI Controls ---

  // Handle date change from WeekSelector
  const handleDateChange = useCallback(
    (newDateInput: Date) => {
      const newDate = normalizeDate(newDateInput); // Normalize
      // console.log(
      //   "Viz: handleDateChange called with:",
      //   format(newDate, "yyyy-MM-dd")
      // );
      // Reset selections when changing dates
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);
      // Notify parent about the date change
      onDateSelect(newDate);
      // The useEffect above will handle fetching based on the *new* selectedDate prop change
    },
    [onDateSelect] // Only depends on the callback prop
  );

  // Handle Level Change
  const handleLevelChange = useCallback(
    (newLevel: VisualizationLevel["type"]) => {
      // console.log("Viz: handleLevelChange called with:", newLevel);
      setCurrentLevel(newLevel);
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);
      // Trigger fetch check via the useEffect dependency change
    },
    []
  );

  // --- Derived Data for Rendering ---

  // Calculate dates to display based on level and selectedDate prop
  const datesToDisplay = useMemo(() => {
    const normalizedSelected = normalizeDate(selectedDate); // Use prop, normalize
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
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error(
        "Invalid start or end date for interval:",
        startDate,
        endDate
      );
      return [normalizeDate(new Date())]; // Fallback
    }
    try {
      return eachDayOfInterval({ start: startDate, end: endDate });
    } catch (rangeError) {
      console.error("Error creating date interval:", rangeError, {
        startDate,
        endDate,
      });
      return [normalizeDate(selectedDate)]; // Fallback to selected date
    }
  }, [selectedDate, currentLevel]);

  // Filter TRACE data for the visible range using the local traceData state
  const visibleTraceData = useMemo(() => {
    // Ensure datesToDisplay contains valid, normalized dates
    const validDatesToDisplay = datesToDisplay
      .map(normalizeDate)
      .filter(isValidDate);

    return validDatesToDisplay.map((date) => {
      // Find data for the current date using normalized comparison
      const existingDay = traceData.find(
        (day) => isSameNormalizedDay(day.date, date) // Use robust comparison
      );
      return existingDay
        ? { ...existingDay, date: date }
        : { date: date, meals: [] };
    });
  }, [traceData, datesToDisplay]);

  const hasRecommendationsInView = useMemo(() => {
    const visibleDateStrings = new Set(
        datesToDisplay.map(date => format(normalizeDate(date), 'yyyy-MM-dd'))
    );
    return recommendationData.some(dayRec => {
        const dayDateStr = format(normalizeDate(dayRec.date), 'yyyy-MM-dd');
        return visibleDateStrings.has(dayDateStr) && dayRec.recommendations.length > 0;
    });
  }, [recommendationData, datesToDisplay]);

  const handleRegenerateClick = useCallback(() => {
    if (isRegenerating || !hasRecommendationsInView) {
      return; // Do nothing if already regenerating or no recommendations in view
    }

    // 1. Create a Set of date strings (yyyy-MM-dd) that have recommendations
    const datesWithRecsSet = new Set<string>();
    recommendationData.forEach(dayRec => {
        if (dayRec.recommendations && dayRec.recommendations.length > 0) {
            const normalizedDate = normalizeDate(dayRec.date);
            if (isValidDate(normalizedDate)) {
                datesWithRecsSet.add(format(normalizedDate, 'yyyy-MM-dd'));
            }
        }
    });

    // 2. Filter the currently displayed dates to include only those with recommendations
    const datesToRegenerate = datesToDisplay
        .map(date => {
            const normalizedVisibleDate = normalizeDate(date);
            return isValidDate(normalizedVisibleDate) ? format(normalizedVisibleDate, 'yyyy-MM-dd') : null;
        })
        .filter((dateStr): dateStr is string =>
            dateStr !== null && datesWithRecsSet.has(dateStr) // Check if the visible date has recommendations
        );

    // 3. Check if any dates remain after filtering
    if (datesToRegenerate.length === 0) {
        console.log("Viz: No recommendations found in the current view to regenerate.");
        // Optionally show a user message/tooltip update here if needed
        return;
    }

    // 4. Call the parent handler with the filtered list
    console.log("Viz: Regenerate button clicked. Calling onRegeneratePartial for dates with recommendations:", datesToRegenerate.join(', '));
    onRegeneratePartial(datesToRegenerate);

  }, [datesToDisplay, recommendationData, onRegeneratePartial, isRegenerating, hasRecommendationsInView]); // Added recommendationData dependency


  // Rendering
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <p>Error in Visualization: {error}</p>
      </div>
    );
  }

  // Provide default goals if nutritionalGoals prop is null
  const defaultGoals: NutritionalGoals = {
    dailyCalories: 2000,
    carbohydrates: { daily: 250, unit: "g" },
    protein: { daily: 100, unit: "g" },
    fiber: { daily: 30, unit: "g" },
  };
  const goalsToDisplay = nutritionalGoals || defaultGoals;

  const regenerateButtonTooltip = isRegenerating
    ? "Regenerating recommendations..."
    : !hasRecommendationsInView
    ? "No recommendations in the current view to regenerate"
    : "Regenerate recommendations for dates with plans in current view";

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
                onClick={handleRegenerateClick} // Use the new handler
                className={`px-3 py-1.5 rounded-md text-sm flex items-center transition-colors duration-200
                  ${
                    isRegenerating || !hasRecommendationsInView // Disable if regenerating OR no recs in view
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }
                `}
                disabled={isRegenerating || !hasRecommendationsInView} // Disable based on the check
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
            {/* Wrap WeekSelector for click handling */}
            <div className="week-selector-container">
              <WeekSelector
                selectedDate={selectedDate} // Pass selectedDate prop
                onDateChange={handleDateChange} // Use updated handler
              />
            </div>
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
                      datesToDisplay={datesToDisplay}
                      allData={traceData}
                      recommendationData={recommendationData}
                      selectedDate={selectedDate}
                      onMealSelect={handleMealSelect}
                      selectedMeal={selectedMeal}
                      onRecommendationSelect={handleRecommendationSelect}
                      onAcceptRecommendationClick={handleAcceptRecommendation}
                      onRejectRecommendationClick={handleRejectRecommendation}
                      selectedRecommendation={selectedRecommendation}
                      mealBinNames={mealBinNames}
                      onMealBinUpdate={handleMealBinNamesUpdate}
                      isLoading={loadingRecommendations}
                    />
                  </div>
                )}
                {currentLevel === "food" && (
                  <div className="food-view-background h-full">
                    <FoodView
                      datesToDisplay={visibleTraceData}
                      allData={traceData}
                      recommendationData={recommendationData}
                      onFoodSelect={handleFoodSelect}
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
                      selectedDateData={visibleTraceData.find((d) =>
                        isSameNormalizedDay(d.date, selectedDate)
                      )}
                      recommendationData={recommendationData}
                      onIngredientSelect={handleIngredientSelect}
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

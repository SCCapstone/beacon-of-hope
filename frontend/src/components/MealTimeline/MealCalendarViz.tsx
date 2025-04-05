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
  startOfDay,
  parseISO,
} from "date-fns";

// Normalize date handling function (handle string input)
const normalizeDate = (date: Date | string): Date => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    console.warn(
      "Viz normalizeDate received invalid input, returning current date:",
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
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false; // Invalid date check
  return isSameDay(d1, d2);
};

// Define the type for the callback to parent for fetching
type FetchRequestHandler = (payload: {
  datesToFetch: string[]; // Only the dates that *need* fetching
}) => void;

// Define the type for the callback to parent for date selection
type DateSelectHandler = (newDate: Date) => void;

interface MealCalendarVizProps {
  mealData: DayMeals[]; // This prop represents the initial/fetched trace data
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
  mealPlan?: any; // This comes from localStorage, used for recommendations
  onRequestFetch: FetchRequestHandler; // Updated type
  onDateSelect: DateSelectHandler; // New prop
  selectedDate: Date; // Renamed from initialSelectedDate
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({
  mealData: initialTraceData, // Rename prop for clarity
  nutritionalGoals,
  mealPlan,
  onRequestFetch,
  onDateSelect, // Use the new prop
  selectedDate, // Use the selectedDate prop directly
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
  const traceDataRef = useRef(initialTraceData);

  // --- State Synchronization and Data Handling ---

  // Update local traceData state and ref when the initialTraceData prop changes
  useEffect(() => {
    // console.log("Viz: initialTraceData prop changed, attempting smart merge.");
    const currentLocalData = traceDataRef.current;

    // Create a map from the incoming data from the parent for efficient lookup
    const parentDataMap = new Map(
      initialTraceData
        .map((day) => {
          const normalizedDayDate = normalizeDate(day.date); // Normalize
          const dateKey =
            normalizedDayDate instanceof Date &&
            !isNaN(normalizedDayDate.getTime())
              ? format(normalizedDayDate, "yyyy-MM-dd")
              : null;
          // Ensure meals array exists and is an array
          const meals = Array.isArray(day.meals) ? [...day.meals] : [];
          return dateKey
            ? [dateKey, { ...day, date: normalizedDayDate, meals }]
            : null;
        })
        .filter((item) => item !== null) as [string, DayMeals][]
    );

    // Create a map for the merged result, initially populated with parent data
    const mergedDataMap = new Map(parentDataMap);

    // Iterate through the current local state to find optimistic/local-only updates
    currentLocalData.forEach((localDay) => {
      const normalizedLocalDayDate = normalizeDate(localDay.date); // Normalize
      const dateStr =
        normalizedLocalDayDate instanceof Date &&
        !isNaN(normalizedLocalDayDate.getTime())
          ? format(normalizedLocalDayDate, "yyyy-MM-dd")
          : null;
      if (!dateStr) return;

      const mergedDay = mergedDataMap.get(dateStr);

      if (!mergedDay) {
        // If this day doesn't exist in parent data at all, keep the local day entirely
        // console.log(`Viz Merge: Keeping local-only day ${dateStr}`);
        mergedDataMap.set(dateStr, {
          ...localDay,
          date: normalizedLocalDayDate,
        }); // Ensure date is normalized
      } else {
        // If the day exists in parent data, compare meals
        const mergedMealMap = new Map(mergedDay.meals.map((m) => [m.id, m]));
        let dayChanged = false;

        // Ensure localDay.meals is an array before iterating
        const localMeals = Array.isArray(localDay.meals) ? localDay.meals : [];

        localMeals.forEach((localMeal) => {
          if (!mergedMealMap.has(localMeal.id)) {
            // This meal exists locally but not in the (potentially updated) parent data for this day
            // This is likely our optimistically added meal. Add it back.
            // console.log(
            //   `Viz Merge: Adding local-only meal '${localMeal.id}' to ${dateStr}`
            // );
            mergedMealMap.set(localMeal.id, localMeal);
            dayChanged = true;
          }
          // Optional: Add logic here to handle cases where a meal exists in both
          // but might have been updated locally (though less likely in this scenario).
        });

        if (dayChanged) {
          // Update the day in the merged map with the combined meals
          mergedDataMap.set(dateStr, {
            ...mergedDay,
            date: normalizedLocalDayDate, // Ensure date is normalized
            meals: Array.from(mergedMealMap.values()),
          });
        }
      }
    });

    // Convert the final merged map back to an array and sort by date
    const mergedDataArray = Array.from(mergedDataMap.values()).sort(
      (a, b) =>
        normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime() // Normalize for sort
    );

    // Update the ref *immediately* with the merged data
    traceDataRef.current = mergedDataArray;

    // Use JSON stringify for comparison, ensure dates are handled consistently if needed
    // A deep comparison function might be more robust if date objects cause issues
    if (JSON.stringify(mergedDataArray) !== JSON.stringify(traceData)) {
      // console.log(
      //   "Viz Merge: Merged data differs from local state. Updating traceData state."
      // );
      setTraceData(mergedDataArray);
    } else {
      // console.log(
      //   "Viz Merge: Merged data is the same as local state. No update needed."
      // );
    }
  }, [initialTraceData]);

  const handleMealBinNamesUpdate = (newNames: string[]) => {
    setMealBinNames(newNames);
    // Optionally save to localStorage for persistence
    localStorage.setItem("mealBinNames", JSON.stringify(newNames));
  };

  // Load recommendations based on mealPlan prop (from localStorage)
  useEffect(() => {
    async function loadRecommendations() {
      try {
        if (mealPlan && Object.keys(mealPlan).length > 0) {
          setLoadingRecommendations(true);
          setError(null);

          const mealPlanKey = JSON.stringify(mealPlan);
          const cachedRecommendations = sessionStorage.getItem(
            `recommendations-${mealPlanKey}`
          );

          let recommendations: DayRecommendations[];
          if (cachedRecommendations) {
            recommendations = (
              JSON.parse(cachedRecommendations) as Array<{
                date: string;
                recommendations: MealRecommendation[];
              }>
            ).map(
              (day): DayRecommendations => ({
                ...day,
                date: normalizeDate(day.date), // Normalize date on load
              })
            );
            // console.log("Viz: Loaded recommendations from sessionStorage.");
          } else {
            // console.log("Viz: Transforming meal plan to recommendations...");
            const transformedData = await transformMealPlanToRecommendations(
              mealPlan
            );
            recommendations = transformedData.map((day) => ({
              date: normalizeDate(day.date), // Normalize date on transform
              recommendations: day.recommendations || [],
            }));
            // console.log(
            //   "Viz: Transformation complete. Caching in sessionStorage."
            // );
            sessionStorage.setItem(
              `recommendations-${mealPlanKey}`,
              JSON.stringify(
                recommendations.map((day) => ({
                  ...day,
                  date: format(day.date, "yyyy-MM-dd"),
                }))
              ) // Store date as string
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
  }, [selectedDate, selectedRecommendation, calculateBaseNutrition]); // Depend on selectedDate prop

  // --- Selection Handlers ---
  const handleMealSelect = (meal: Meal | null) => {
    setSelectedMeal(meal); // Selects a TRACE meal
    setSelectedFood(null);
    setSelectedIngredient(null);
    setSelectedRecommendation(null); // Clear recommendation selection
  };

  const handleFoodSelect = (food: Food | null, isRecommended?: boolean) => {
    // If a recommended food is clicked, select the parent recommendation
    if (food && isRecommended) {
      const normalizedSelected = normalizeDate(selectedDate);
      const dayRecs = recommendationData.find((day) =>
        isSameNormalizedDay(day.date, normalizedSelected)
      );
      const parentRecommendation = dayRecs?.recommendations.find((rec) =>
        rec.meal.foods.some((f) => f.id === food.id)
      );
      if (parentRecommendation) {
        handleRecommendationSelect(parentRecommendation); // Select the recommendation
      } else {
        // Fallback: Select the food itself, clear others
        setSelectedFood(food);
        setSelectedMeal(null);
        setSelectedIngredient(null);
        setSelectedRecommendation(null);
      }
    } else {
      // Selecting a trace food or deselecting
      setSelectedFood(food);
      setSelectedMeal(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null); // Clear recommendation selection
    }
  };

  const handleIngredientSelect = (
    ingredient: Ingredient | null,
    isRecommended?: boolean
  ) => {
    // If a recommended ingredient is clicked, select the parent recommendation
    if (ingredient && isRecommended) {
      const dayRecs = recommendationData.find((day) =>
        isSameNormalizedDay(day.date, selectedDate)
      );
      const parentRecommendation = dayRecs?.recommendations.find((rec) =>
        rec.meal.foods.some((food) =>
          food.ingredients.some(
            (ing) =>
              ing.id === ingredient.id ||
              (!ing.id && !ingredient.id && ing.name === ingredient.name)
          )
        )
      );
      if (parentRecommendation) {
        handleRecommendationSelect(parentRecommendation); // Select the recommendation
      } else {
        // Fallback: Select the ingredient itself, clear others
        setSelectedIngredient(ingredient);
        setSelectedMeal(null);
        setSelectedFood(null);
        setSelectedRecommendation(null);
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

      console.log("Viz: Accepting recommendation:", acceptedRec.meal.name, "ID:", acceptedRec.meal.id);
      const acceptedMeal = acceptedRec.meal;
      const backendIdToRemove = acceptedMeal.originalBackendId;
      const mealDate = normalizeDate(acceptedMeal.date || selectedDate);
      const mealDateStr = format(mealDate, "yyyy-MM-dd");

      console.log(
        `Viz: Accepting recommendation: Name='${acceptedMeal.name}', ID='${acceptedMeal.id}', OriginalBackendID='${backendIdToRemove}', Date='${mealDateStr}'`
      );

      if (!backendIdToRemove) {
        console.error(
          "Viz: CRITICAL - Cannot process acceptance. originalBackendId is missing:",
          acceptedRec
        );
        // Optionally show an error to the user
        alert(
          "Error: Could not accept recommendation due to missing internal ID."
        );
        return; // Stop processing if the ID is missing
      }

      // 1. Optimistic UI Update for Trace Data (using setTraceData)
      setTraceData((prevTraceData) => {
        const newData = [...prevTraceData];
        const dayIndex = newData.findIndex((day) =>
          isSameNormalizedDay(day.date, mealDate)
        );

        const traceMealToAdd: Meal = {
          ...acceptedMeal,
          id: `trace-${acceptedMeal.id}-${Date.now()}`,
          date: mealDate, // Ensure date is normalized Date object
        };

        if (dayIndex > -1) {
          const day = newData[dayIndex];
          // Ensure meals array exists
          const currentMeals = Array.isArray(day.meals) ? day.meals : [];
          // Check if a meal with the *same original backend ID* already exists in trace
          const alreadyExists = currentMeals.some(
            (m) => m.originalBackendId === backendIdToRemove
          );
          if (!alreadyExists) {
            newData[dayIndex] = {
              ...day,
              date: mealDate,
              meals: [...currentMeals, traceMealToAdd],
            };
            console.log(
              `Viz: Optimistically added meal '${traceMealToAdd.id}' (from rec ${backendIdToRemove}) to traceData state for ${mealDateStr}.`
            );
          } else {
            console.log(
              `Viz: Meal with original ID '${backendIdToRemove}' already in traceData state for ${mealDateStr}. Skipping optimistic add.`
            );
          }
        } else {
          newData.push({ date: mealDate, meals: [traceMealToAdd] });
          console.log(
            `Viz: Optimistically created new day ${mealDateStr} in traceData state for meal '${traceMealToAdd.id}'.`
          );
        }
        const sortedData = newData.sort(
          (a, b) =>
            normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime()
        );
        traceDataRef.current = sortedData;
        return sortedData;
      });

      // 2. Update Recommendation Data State
      setRecommendationData((prevRecData) => {
        const updatedRecData = prevRecData
          .map((dayRec) => {
            if (isSameNormalizedDay(dayRec.date, mealDate)) {
              return {
                ...dayRec,
                date: normalizeDate(dayRec.date), // Ensure date is normalized
                recommendations: dayRec.recommendations.filter(
                  (rec) => rec.meal.id !== acceptedRec.meal.id
                ),
              };
            }
            return { ...dayRec, date: normalizeDate(dayRec.date) }; // Ensure date is normalized
          })
          .filter((dayRec) => dayRec.recommendations.length > 0);
        // console.log(
        //   "Viz: Updated recommendationData state (removed accepted visual)."
        // );
        return updatedRecData;
      });

      // 3. Update localStorage["mealPlan"]
      try {
        const rawMealPlanString = localStorage.getItem("mealPlan");
        if (rawMealPlanString) {
          let rawMealPlan = JSON.parse(rawMealPlanString);
          let changed = false;
          if (
            rawMealPlan.days &&
            rawMealPlan.days[mealDateStr] &&
            rawMealPlan.days[mealDateStr].meals
          ) {
            const initialLength = rawMealPlan.days[mealDateStr].meals.length;
            rawMealPlan.days[mealDateStr].meals = rawMealPlan.days[
              mealDateStr
            ].meals.filter((rawMeal: any) => rawMeal._id !== backendIdToRemove);
            const finalLength = rawMealPlan.days[mealDateStr].meals.length;
            if (finalLength < initialLength) {
              changed = true;
              if (finalLength === 0) delete rawMealPlan.days[mealDateStr];
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
            localStorage.setItem("mealPlan", JSON.stringify(rawMealPlan));
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith("recommendations-"))
                sessionStorage.removeItem(key);
            });
            console.log(
              "Viz: Updated localStorage['mealPlan'] and cleared recommendation caches after acceptance."
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

      // 5. Trigger Re-fetch for Persistence
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
      console.log("Viz: handleRejectRecommendation invoked for:", rejectedRec.meal.name, rejectedRec.meal.id);

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

      // 1. Update Recommendation Data State (Remove visually)
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
          .filter((dayRec) => dayRec.recommendations.length > 0); // Remove day if no recommendations left
        console.log(
          "Viz: Updated recommendationData state (removed rejected visual)."
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
            rawMealPlan.days[mealDateStr].meals
          ) {
            const initialLength = rawMealPlan.days[mealDateStr].meals.length;
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
            localStorage.setItem("mealPlan", JSON.stringify(rawMealPlan));
            console.log(
              "Viz: Updated localStorage['mealPlan'] after rejection."
            );

            // Clear recommendation cache as the source has changed
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith("recommendations-")) {
                sessionStorage.removeItem(key);
              }
            });
            console.log(
              "Viz: Cleared all sessionStorage recommendation caches after rejection."
            );
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
      recommendationData,
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
    // console.log(
    //   `Viz Effect: Checking fetch for level=${currentLevel}, date=${format(
    //     selectedDate,
    //     "yyyy-MM-dd"
    //   )}`
    // );

    const { requiredStartDate, requiredEndDate } = getRequiredRange(
      currentLevel,
      selectedDate
    );
    const requiredDates = eachDayOfInterval({
      start: requiredStartDate,
      end: requiredEndDate,
    });

    const currentTraceData = traceDataRef.current; // Use ref for current data
    const existingDates = new Set(
      currentTraceData
        .map((day) => {
          const normalizedDayDate = normalizeDate(day.date); // Normalize
          return normalizedDayDate instanceof Date &&
            !isNaN(normalizedDayDate.getTime())
            ? format(normalizedDayDate, "yyyy-MM-dd")
            : null;
        })
        .filter((dateStr) => dateStr !== null)
    );

    const missingDateStrings = requiredDates
      .map((date) => format(normalizeDate(date), "yyyy-MM-dd")) // Normalize before format
      .filter((dateStr) => !existingDates.has(dateStr));

    if (missingDateStrings.length > 0) {
      // console.log(
      //   "Viz Effect: Requesting fetch for missing dates:",
      //   missingDateStrings
      // );
      // Request fetch with only the missing dates
      onRequestFetch({
        datesToFetch: missingDateStrings,
      });
    }
    // else {
    //   console.log(
    //     "Viz Effect: All required dates already loaded. No fetch request needed."
    //   );
    // }
    // Depend on the formatted date string and level to avoid issues with Date object identity
    // Also depend on traceDataRef.current indirectly via initialTraceData prop in the other effect
  }, [
    currentLevel,
    selectedDate,
    getRequiredRange,
    onRequestFetch,
    initialTraceData,
  ]);

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
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [selectedDate, currentLevel]);

  // Filter TRACE data for the visible range using the local traceData state
  const visibleTraceData = useMemo(() => {
    return datesToDisplay.map((date) => {
      const normalizedDate = normalizeDate(date); // Normalize
      const existingDay = traceData.find((day) =>
        isSameNormalizedDay(day.date, normalizedDate)
      );
      if (existingDay) {
        return { ...existingDay, date: normalizedDate }; // Return normalized date
      } else {
        return {
          date: normalizedDate,
          meals: [],
        };
      }
    });
  }, [traceData, datesToDisplay]);

  // Rendering
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
      style={{ height: "calc(100vh - 64px)" }}
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

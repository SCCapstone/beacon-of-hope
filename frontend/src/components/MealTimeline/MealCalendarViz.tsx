import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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
  format,
  isSameDay,
  startOfDay,
  parseISO,
  isValid as isValidDate,
} from "date-fns";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  TrashIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { CustomModal, ModalProps } from "../CustomModal";

const mealTypePriority = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

const DEFAULT_BIN_COUNT = 3;

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
  isFetchingPast: boolean;
  isFetchingFuture: boolean;
  loadedStartDate: Date | null;
  loadedEndDate: Date | null;
  getMealsForDate: (date: Date) => Meal[];
  getRecommendationsForDate: (date: Date) => MealRecommendation[];
  organizeMealsIntoBins: (date: Date) => {
    bins: Record<
      string,
      { meals: Meal[]; recommendations: MealRecommendation[] }
    >;
    maxBinsNeeded: number;
    currentBinNames: string[];
  };
  allAvailableDates: Date[];
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({
  mealData: initialTraceData,
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
  const [scrollToTodayTrigger, setScrollToTodayTrigger] = useState<number>(0);
  const [modalConfig, setModalConfig] = useState<ModalProps | null>(null); // State for modal
  const [isExpanded, setIsExpanded] = useState(false); // State for expansion

  // State Synchronization and Data Handling
  // Effect to update local traceData state when initialTraceData prop changes
  useEffect(() => {
    // console.log("Viz: initialTraceData prop changed. Updating local state.");
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
      // console.log(
      //   "Viz: Updating traceData state with new normalized data from props."
      // );
      setTraceData(sortedNormalizedData);
    } else {
      // console.log(
      //   "Viz: Normalized prop data matches current traceData state. No update needed."
      // );
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
        // console.log("Viz: Transforming meal plan to recommendations...");
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

          // console.log("Viz: Transformation complete.");
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

  const getDataForDate = useCallback(
    (targetDate: Date): DayMeals | undefined => {
      const normalizedTarget = normalizeDate(targetDate);
      // Use the ref for potentially more up-to-date data before state update completes
      return traceDataRef.current.find((day) => {
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
    [] // Depend only on normalizeDate function reference
  );

  const getMealsForDate = useCallback(
    (targetDate: Date): Meal[] => {
      const dayData = getDataForDate(targetDate);
      return dayData?.meals || [];
    },
    [getDataForDate]
  );

  const getRecommendationsForDate = useCallback(
    (targetDate: Date): MealRecommendation[] => {
      const dayRecs = recommendationData.find((day) =>
        isSameDay(normalizeDate(day.date), normalizeDate(targetDate))
      );
      return dayRecs?.recommendations || [];
    },
    [recommendationData] // Depends on recommendationData state
  );

  const allAvailableDates = useMemo(() => {
    const dateSet = new Set<string>();
    // Use traceDataRef for potentially more up-to-date list
    traceDataRef.current.forEach((day) => {
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

    return sortedDates;
  }, [recommendationData, loadedStartDate, loadedEndDate]); // Add traceDataRef.current? No, useMemo won't track ref changes. Rely on traceData state update triggering re-calc via useEffect dependency chain.

  // Organize meals into bins for each date (moved from MealView)
  const organizeMealsIntoBins = useCallback(
    (date: Date) => {
      const meals = getMealsForDate(date);
      const recommendations = getRecommendationsForDate(date);

      const allItems = [
        ...meals.map((meal) => ({
          type: "meal",
          item: meal,
          time: meal.time,
          mealType: meal.type,
        })),
        ...recommendations.map((rec) => ({
          type: "recommendation",
          item: rec,
          time: rec.meal.time,
          mealType: rec.meal.type,
        })),
      ].sort((a, b) => {
        const timeCompare = a.time.localeCompare(b.time);
        if (timeCompare !== 0) return timeCompare;
        const priorityA = mealTypePriority[a.mealType] ?? 99;
        const priorityB = mealTypePriority[b.mealType] ?? 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.type === "meal" ? -1 : 1; // Prioritize trace meals if time/type are same
      });

      const maxBinsNeeded = allItems.length;
      const bins: Record<
        string,
        { meals: Meal[]; recommendations: MealRecommendation[] }
      > = {};
      const currentBinNames: string[] = [];

      // Ensure enough bins exist based on the maximum needed for *this specific date*
      const binCountForThisDate = Math.max(mealBinNames.length, maxBinsNeeded);

      for (let i = 0; i < binCountForThisDate; i++) {
        const binName = mealBinNames[i] || `Meal Slot ${i + 1}`;
        bins[binName] = { meals: [], recommendations: [] };
        currentBinNames.push(binName);
      }

      allItems.forEach((item, index) => {
        if (index < currentBinNames.length) {
          const binName = currentBinNames[index];
          if (item.type === "meal") {
            bins[binName].meals.push(item.item as Meal);
          } else {
            bins[binName].recommendations.push(item.item as MealRecommendation);
          }
        } else {
          // This case should ideally not happen if binCountForThisDate is calculated correctly
          console.warn(
            `MealCalendarViz: Bin index out of bounds during distribution. Index: ${index}, Bins available: ${currentBinNames.length}`
          );
          // Fallback: Add to the last available bin? Or create a new one?
          // For simplicity, let's log and potentially skip.
        }
      });

      return { bins, maxBinsNeeded, currentBinNames };
    },
    [getMealsForDate, getRecommendationsForDate, mealBinNames] // Dependencies
  );

  // Calculate max bins needed and if expansion is required (central calculation)
  const { maxBinsAcrossAllDates, needsExpansion } = useMemo(() => {
    let maxNeeded = DEFAULT_BIN_COUNT;
    let anyDateNeedsExpansion = false;
    for (const date of allAvailableDates) {
      const { maxBinsNeeded } = organizeMealsIntoBins(date);
      if (maxBinsNeeded > maxNeeded) {
        maxNeeded = maxBinsNeeded;
      }
      if (maxBinsNeeded > DEFAULT_BIN_COUNT) {
        anyDateNeedsExpansion = true;
      }
    }
    // Ensure maxNeeded is at least the default count
    maxNeeded = Math.max(maxNeeded, DEFAULT_BIN_COUNT);
    return {
      maxBinsAcrossAllDates: maxNeeded,
      needsExpansion: anyDateNeedsExpansion,
    };
  }, [allAvailableDates, organizeMealsIntoBins]); // Dependencies

  // Determine if the button should be shown
  const showExpansionButton = needsExpansion;

  const showModal = useCallback(
    (config: Omit<ModalProps, "isOpen" | "onClose">) => {
      setModalConfig({
        ...config,
        isOpen: true,
        onClose: () => setModalConfig(null), // Default close action
      });
    },
    []
  );

  const showConfirmModal = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      showModal({
        title,
        message,
        type: "confirm",
        onConfirm: () => {
          onConfirm();
          setModalConfig(null); // Close after confirm
        },
        onCancel: () => {
          // Also close on cancel
          onCancel?.();
          setModalConfig(null);
        },
      });
    },
    [showModal]
  );

  const showErrorModal = useCallback(
    (title: string, message: string) => {
      showModal({ title, message, type: "error" });
    },
    [showModal]
  );

  const showSuccessModal = useCallback(
    (title: string, message: string) => {
      showModal({ title, message, type: "success" });
    },
    [showModal]
  );

  const handleClearAllRecommendations = useCallback(() => {
    // Check if there are actually recommendations to clear
    const hasRecommendations = recommendationData.some(
      (dayRec) => dayRec.recommendations.length > 0
    );
    if (!hasRecommendations) return;

    showConfirmModal(
      "Confirm Clear Recommendations",
      "Are you sure you want to clear all current meal recommendations? This action cannot be undone and will remove them from view.",
      () => {
        // Confirmation Logic
        console.log("Clearing all recommendations...");

        // 1. Clear recommendation state in the component
        setRecommendationData([]);

        // 2. Clear any selection that might be a recommendation
        setSelectedRecommendation(null);
        // Clear food/ingredient if they might be linked
        // (Add checks if necessary to see if selectedFood/Ingredient belongs to a recommendation)
        setSelectedFood(null);
        setSelectedIngredient(null);

        // 3. Clear the 'mealPlan' from localStorage
        try {
          localStorage.removeItem("mealPlan");
          console.log("Cleared 'mealPlan' from localStorage.");
          showSuccessModal(
            "Recommendations Cleared",
            "All recommendations have been removed."
          );
        } catch (e) {
          console.error("Failed to clear 'mealPlan' from localStorage:", e);
          showErrorModal(
            "Storage Error",
            "Could not clear recommendations from storage, but they have been removed from the current view."
          );
        }

        // Modal closes automatically via showConfirmModal's setup
      },
      () => {
        console.log("Clear recommendations cancelled.");
      }
    );
  }, [
    recommendationData, // Dependency: need to know if there are recs
    showConfirmModal,
    setRecommendationData,
    setSelectedRecommendation,
    setSelectedFood,
    setSelectedIngredient,
    showErrorModal,
    showSuccessModal,
  ]);

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
      const acceptedMeal = acceptedRec.meal;
      const backendIdToSave = acceptedMeal.originalBackendId;
      const mealDate = normalizeDate(acceptedMeal.date || selectedDate);
      const mealDateStr = format(mealDate, "yyyy-MM-dd");

      if (!backendIdToSave || !userId) {
        showErrorModal(
          "Action Failed",
          "Cannot accept recommendation due to missing internal ID or user info."
        );
        return;
      }

      // Use modal for confirmation
      showConfirmModal(
        "Confirm Action",
        `Add "${acceptedRec.meal.name}" to your meal history for ${format(
          mealDate,
          "MMM d"
        )}? This action saves the meal.`,
        async () => {
          // Confirmation logic goes here
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
                meals: [
                  ...(newData[dayIndex].meals || []),
                  traceMealToAdd,
                ].sort((a, b) => a.time.localeCompare(b.time)),
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
                    const finalLength =
                      rawMealPlan.days[mealDateStr].meals.length;
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
                    localStorage.setItem(
                      "mealPlan",
                      JSON.stringify(rawMealPlan)
                    );
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
              showErrorModal(
                "Save Failed",
                "Failed to save the meal. Recommendation restored."
              ); // Use modal
              setTraceData((prevTraceData) => {
                const revertedData = prevTraceData
                  .map((day) => {
                    if (isSameNormalizedDay(day.date, mealDate)) {
                      return {
                        ...day,
                        meals: day.meals.filter(
                          (m) => m.id !== traceMealToAdd.id
                        ),
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
            showErrorModal(
              "Save Error",
              "An error occurred while saving. Recommendation restored."
            ); // Use modal
            setTraceData((prevTraceData) => {
              const revertedData = prevTraceData
                .map((day) => {
                  if (isSameNormalizedDay(day.date, mealDate)) {
                    return {
                      ...day,
                      meals: day.meals.filter(
                        (m) => m.id !== traceMealToAdd.id
                      ),
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
        } // End of confirmation logic
      ); // End of showConfirmModal call
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
      showConfirmModal,
      showErrorModal,
    ]
  );

  // Reject Recommendation Handler
  const handleRejectRecommendation = useCallback(
    (rejectedRec: MealRecommendation) => {
      const rejectedMeal = rejectedRec.meal;
      const backendIdToRemove = rejectedMeal.originalBackendId;
      const mealDate = normalizeDate(rejectedMeal.date || selectedDate);
      const mealDateStr = format(mealDate, "yyyy-MM-dd");

      if (!backendIdToRemove) {
        showErrorModal(
          "Action Failed",
          "Could not reject recommendation due to missing internal ID."
        );
        return;
      }

      // Use modal for confirmation
      showConfirmModal(
        "Confirm Action",
        `Reject recommendation "${rejectedRec.meal.name}" for ${format(
          mealDate,
          "MMM d"
        )}?`,
        () => {
          // Confirmation logic
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
                const initialLength =
                  rawMealPlan.days[mealDateStr].meals.length;
                rawMealPlan.days[mealDateStr].meals = rawMealPlan.days[
                  mealDateStr
                ].meals.filter(
                  (rawMeal: any) => rawMeal._id !== backendIdToRemove
                );
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

          // 3. Clear Selections
          if (selectedRecommendation?.meal.id === rejectedRec.meal.id) {
            setSelectedRecommendation(null);
            setSelectedMeal(null);
            setSelectedFood(null);
            setSelectedIngredient(null);
          }
        } // End confirmation logic
      ); // End showConfirmModal call
    },
    [
      selectedDate,
      setRecommendationData,
      selectedRecommendation,
      setSelectedRecommendation,
      setSelectedMeal,
      setSelectedFood,
      setSelectedIngredient,
      showConfirmModal,
      showErrorModal,
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
      setScrollToTodayTrigger((prev) => prev + 1);
      // console.log("Viz: Date changed via picker/selector, triggering scroll.");
    },
    [onDateSelect]
  );

  // handleGoToToday
  const handleGoToToday = useCallback(() => {
    const today = normalizeDate(new Date());
    // Always update the date state via the parent first
    handleDateChange(today);
    // console.log("Viz: Today button clicked, triggering scroll via handleDateChange.");
  }, [handleDateChange]); // Keep handleDateChange dependency

  const handleLevelChange = useCallback(
    (newLevel: VisualizationLevel["type"]) => {
      setCurrentLevel(newLevel);
      // Reset selections as the context changes between levels
      setSelectedMeal(null);
      setSelectedFood(null);
      setSelectedIngredient(null);
      setSelectedRecommendation(null);

      // Trigger a scroll effect to ensure the view scrolls to the currently selected date
      // in the new level's layout. The name "scrollToTodayTrigger" is slightly misleading now,
      // but its function (triggering scroll-to-selected-date) remains correct.
      setScrollToTodayTrigger((prev) => prev + 1);
      // console.log(`Viz: Level changed to ${newLevel}. Keeping selected date and triggering scroll.`);
    },
    []
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

  const handleShowRecipe = useCallback(
    (foodToShow: Food) => {
      // Prepare the content for the modal
      const recipeContent = (
        <div className="space-y-4 text-sm max-h-[65vh] overflow-y-auto pr-3 -mr-1">
          {/* Ingredients */}
          <div>
            <h4 className="font-semibold mb-1 text-base text-gray-800 sticky top-0 bg-white py-1 z-10 -mt-1 pt-1">
              Ingredients
            </h4>
            {foodToShow.ingredients && foodToShow.ingredients.length > 0 ? (
              <ul className="list-disc list-inside pl-4 space-y-1 text-gray-700">
                {foodToShow.ingredients.map((ing, index) => (
                  <li key={ing.id || `${ing.name}-${index}`}>
                    {ing.name} ({ing.amount} {ing.unit})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No ingredients listed.</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-semibold mb-1 text-base text-gray-800 sticky top-0 bg-white py-1 z-10 -mt-1 pt-1">
              Instructions
            </h4>
            {foodToShow.instructions && foodToShow.instructions.length > 0 ? (
              <ol className="list-decimal list-inside pl-4 space-y-2 text-gray-700">
                {foodToShow.instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500">No instructions provided.</p>
            )}
          </div>

          {/* Times */}
          {(foodToShow.preparationTime > 0 || foodToShow.cookingTime > 0) && (
            <div className="pt-2 border-t mt-4 text-xs text-gray-600">
              {foodToShow.preparationTime > 0 &&
                `Prep: ${foodToShow.preparationTime} min `}
              {foodToShow.cookingTime > 0 &&
                `Cook: ${foodToShow.cookingTime} min`}
            </div>
          )}
        </div>
      );

      showModal({
        title: `Recipe: ${foodToShow.name}`,
        children: recipeContent,
        type: "info",
        size: "large",
        hideCancelButton: true,
      });
    },
    [showModal]
  );

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

  const expandButtonTooltip = isExpanded
    ? "Show Fewer Meal Slots"
    : "Show All Meal Slots";

  return (
    <div
      className="w-screen flex flex-col overflow-hidden bg-[#FFFBF5]"
      ref={vizRef}
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Main Content */}
      <div className="w-full h-full flex flex-col overflow-hidden box-border">
        {/* Center Calendar View */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FEF9F0] overflow-hidden">
          {/* Level Selector Bar */}
          <div className="w-full h-16 px-4 bg-white border-b border-gray-200 shadow-md z-10 flex items-center justify-between">
            {/* Left Side: Level Selector */}
            <div className="flex items-center space-x-4">
              <LevelSelector
                currentLevel={currentLevel}
                onLevelChange={handleLevelChange}
              />
            </div>

            {/* Center: Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Regenerate Button - Conditionally Rendered */}
              {!isRegenerating && hasRecommendationsInView && (
                <button
                  onClick={handleRegenerateClick}
                  className="px-3 py-1.5 rounded-md text-sm flex items-center transition-colors duration-200 bg-pink-900 hover:bg-pink-800 text-white"
                  title={regenerateButtonTooltip}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Regenerate Plans
                </button>
              )}
              {/* Show loading indicator if regenerating */}
              {isRegenerating && (
                <button
                  className="px-3 py-1.5 rounded-md text-sm flex items-center transition-colors duration-200 bg-gray-300 text-gray-500 cursor-not-allowed"
                  disabled={true}
                  title={regenerateButtonTooltip}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </button>
              )}

              {/* Clear Recommendations Button - Conditionally Rendered */}
              {hasRecommendationsInView && (
                <button
                  onClick={handleClearAllRecommendations} // Use the new handler
                  className="px-3 py-1.5 rounded-md text-sm flex items-center transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white"
                  title="Clear all current recommendations"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Clear Recommendations
                </button>
              )}

              {currentLevel === "meal" &&
                showExpansionButton && ( // Only show for Meal View and if needed
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1.5 rounded-md text-sm flex items-center border border-[#E0E0E0] text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    title={expandButtonTooltip}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronLeftIcon className="w-4 h-4 mr-1.5" />
                        <span>Collapse Slots</span>
                      </>
                    ) : (
                      <>
                        <ChevronRightIcon className="w-4 h-4 mr-1.5" />
                        <span>Expand Slots</span>
                      </>
                    )}
                  </button>
                )}
            </div>

            {/* Right Side: Date Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 rounded-md text-sm flex items-center border border-[#E0E0E0] text-gray-700 hover:bg-gray-100 transition-colors duration-200"
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
          </div>
          {/* Main Visualization Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Calendar View */}
            <div className="flex-1 min-w-0 p-4 flex flex-col">
              <div
                className="viz-main-area bg-white rounded-lg shadow-md flex-1 overflow-hidden border border-gray-200 flex flex-col"
                onClick={handleMainAreaClick}
              >
                {/* Render Views based on currentLevel */}
                {currentLevel === "meal" && (
                  <div className="meal-view-background h-full">
                    <MealView
                      allData={traceData}
                      recommendationData={recommendationData}
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
                      onRequestFetch={onRequestFetch}
                      isFetchingPast={isFetchingPast}
                      isFetchingFuture={isFetchingFuture}
                      loadedStartDate={loadedStartDate}
                      loadedEndDate={loadedEndDate}
                      scrollToTodayTrigger={scrollToTodayTrigger}
                      isExpanded={isExpanded}
                      maxBinsAcrossAllDates={maxBinsAcrossAllDates}
                      defaultBinCount={DEFAULT_BIN_COUNT}
                      getMealsForDate={getMealsForDate}
                      getRecommendationsForDate={getRecommendationsForDate}
                      organizeMealsIntoBins={organizeMealsIntoBins}
                      allAvailableDates={allAvailableDates}
                    />
                  </div>
                )}
                {currentLevel === "food" && (
                  <div className="food-view-background h-full">
                    <FoodView
                      allData={traceData} // Pass trace data
                      recommendationData={recommendationData} // Pass recommendation data
                      onFoodSelect={handleFoodSelect}
                      selectedFood={selectedFood}
                      mealBinNames={mealBinNames} // Pass bin names
                      onMealBinUpdate={handleMealBinNamesUpdate} // Pass update handler
                      selectedRecommendation={selectedRecommendation} // Pass selection context
                      selectedDate={selectedDate}
                      onRequestFetch={onRequestFetch}
                      isFetchingPast={isFetchingPast}
                      isFetchingFuture={isFetchingFuture}
                      loadedStartDate={loadedStartDate}
                      loadedEndDate={loadedEndDate}
                      scrollToTodayTrigger={scrollToTodayTrigger}
                      organizeMealsIntoBins={organizeMealsIntoBins}
                      allAvailableDates={allAvailableDates}
                      isExpanded={isExpanded}
                      maxBinsAcrossAllDates={maxBinsAcrossAllDates}
                      defaultBinCount={DEFAULT_BIN_COUNT}
                    />
                  </div>
                )}
                {currentLevel === "ingredient" && (
                  <div className="ingredient-view-background h-full">
                    <IngredientView
                      allData={traceData}
                      recommendationData={recommendationData}
                      onIngredientSelect={handleIngredientSelect}
                      selectedIngredient={selectedIngredient}
                      mealBinNames={mealBinNames}
                      onMealBinUpdate={handleMealBinNamesUpdate}
                      selectedRecommendation={selectedRecommendation}
                      selectedDate={selectedDate}
                      onRequestFetch={onRequestFetch}
                      isFetchingPast={isFetchingPast}
                      isFetchingFuture={isFetchingFuture}
                      loadedStartDate={loadedStartDate}
                      loadedEndDate={loadedEndDate}
                      scrollToTodayTrigger={scrollToTodayTrigger}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="meal-details-panel-container w-[480px] bg-white shadow-lg z-10 flex-shrink-0 border-l border-[#E0E0E0]">
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
                onShowRecipe={handleShowRecipe}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Render the Modal */}
      {modalConfig && <CustomModal {...modalConfig} />}
    </div>
  );
};

export default MealCalendarViz;

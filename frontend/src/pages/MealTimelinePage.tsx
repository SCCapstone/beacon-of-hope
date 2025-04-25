import React, { useState, useEffect, useCallback, useRef } from "react";
import MealCalendarViz from "../components/MealTimeline/MealCalendarViz";
import {
  DayMeals,
  UserPreferences,
  UserAnthropometrics,
  Meal,
  NutritionalGoals,
} from "../components/MealTimeline/types";
import { MainLayout } from "../components/Layouts/MainLayout";
import {
  fetchMealDays,
  generateDateRange,
  transformApiResponseToDayMeals,
  fetchNutritionalGoals,
  regeneratePartialMeals,
  saveMealToTrace,
  deleteMealFromTrace,
  favoriteMealInTrace,
} from "../services/recipeService";
import {
  subDays,
  addDays,
  format,
  isSameDay,
  parseISO,
  isValid as isValidDate,
  min as minDate,
  max as maxDate,
} from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { ApiError } from "../utils/errorHandling";
import { CustomModal, ModalProps } from "../components/CustomModal";

const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    console.warn(
      "MealTimeLinePage normalizeDate received null/undefined, returning current date."
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  // Handle string parsing carefully, assuming 'yyyy-MM-dd' or ISO format
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn(
      "MealTimeLinePage normalizeDate received invalid date, returning current date:",
      date
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  // Set hours to 0 to compare dates only
  const normalized = new Date(dateObj);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Type for the callback payload from Viz for fetching
type FetchRequestPayload = {
  datesToFetch: string[]; // Only the dates that need fetching
  direction: "past" | "future" | "initial" | "specific"; // Add direction
};

type SaveMealPayload = {
  userId: string;
  date: string; // yyyy-MM-dd
  mealId: string; // originalBackendId
};

export const MealTimelinePage: React.FC = () => {
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [isLoadingGoals, setIsLoadingGoals] = useState(true); // Specific loading for goals
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFetchingMorePast, setIsFetchingMorePast] = useState(false); // Specific loading state for past
  const [isFetchingMoreFuture, setIsFetchingMoreFuture] = useState(false); // Specific loading state for future
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    normalizeDate(new Date())
  );
  const [nutritionalGoals, setNutritionalGoals] =
    useState<NutritionalGoals | null>(null); // State for goals
  const [modalConfig, setModalConfig] = useState<ModalProps | null>(null);
  // Track the overall loaded range
  const loadedStartDateRef = useRef<Date | null>(null);
  const loadedEndDateRef = useRef<Date | null>(null);

  const initialLoadAttemptedRef = useRef(false);
  const fetchingDatesRef = useRef<Set<string>>(new Set());

  const userId = useSelector((state: RootState) => state.user.user?._id || "");
  // TODO: Might fetch
  const [userPreferences] = useState<UserPreferences>({
    diabetesFriendly: true,
    culturalPreferences: ["african_american"],
    allergies: [],
    dietaryRestrictions: [],
    mealPreferences: {
      breakfast: true,
      lunch: true,
      dinner: true,
      snacks: true,
    },
    foodPreferences: {
      spicyLevel: 2,
      sweetLevel: 1,
      preferredCuisines: ["soul_food", "southern"],
    },
  });
  const [_] = useState<UserAnthropometrics>({
    age: 45,
    weight: 180,
    height: 68,
    activityLevel: "moderate",
    healthConditions: ["diabetes_type_2"],
    bloodSugarLevels: {
      fasting: 100,
      postPrandial: 140,
    },
  });

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

  // useEffect(() => {
  //   const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  //     try {
  //       const rawMealPlanString = localStorage.getItem("mealPlan");
  //       if (rawMealPlanString) {
  //         const mealPlan = JSON.parse(rawMealPlanString);
  //         // Check if there are any days with meals in the plan
  //         if (mealPlan && mealPlan.days && typeof mealPlan.days === "object") {
  //           const hasUnsavedMeals = Object.values(mealPlan.days).some(
  //             (day: any) =>
  //               day && Array.isArray(day.meals) && day.meals.length > 0
  //           );
  //           if (hasUnsavedMeals) {
  //             console.log(
  //               "Unsaved recommendations detected in localStorage. Prompting user."
  //             );
  //             event.preventDefault(); // Standard practice
  //             event.returnValue =
  //               "You have unsaved meal recommendations. Are you sure you want to leave? They will be lost."; // For older browsers
  //             return "You have unsaved meal recommendations. Are you sure you want to leave? They will be lost."; // For modern browsers
  //           }
  //         }
  //       }
  //     } catch (e) {
  //       console.error(
  //         "Error checking localStorage for unsaved recommendations:",
  //         e
  //       );
  //       // Don't block navigation if there's an error reading localStorage
  //     }
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);

  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // Fetch Nutritional Goals
  useEffect(() => {
    const loadGoals = async () => {
      if (userId) {
        setIsLoadingGoals(true);
        try {
          console.log("MealTimelinePage: Fetching nutritional goals...");
          const goals = await fetchNutritionalGoals(userId);
          setNutritionalGoals(goals); // Set goals (can be null if not found)
          console.log("MealTimelinePage: Goals fetched:", goals);
        } catch (err) {
          console.error(
            "MealTimelinePage: Error fetching nutritional goals:",
            err
          );
          // Handle error appropriately, maybe set default goals or show error message
          setError("Could not load nutritional goals."); // Set general error or specific
        } finally {
          setIsLoadingGoals(false);
        }
      } else {
        setIsLoadingGoals(false); // Not loading if no user ID
        setNutritionalGoals(null); // Ensure goals are null if no user
      }
    };
    loadGoals();
  }, [userId]);

  // Function to fetch meal data for a date range
  const fetchMealData = useCallback(
    async (
      datesToFetchParam: string[],
      direction: FetchRequestPayload["direction"]
    ) => {
      // Add direction parameter
      // Filter out dates already being fetched
      const datesActuallyNeedingFetch = datesToFetchParam.filter(
        (dateStr) => !fetchingDatesRef.current.has(dateStr)
      );

      if (datesActuallyNeedingFetch.length === 0) {
        console.log(
          "Page Fetch skipped: Dates already being fetched or empty list.",
          datesToFetchParam
        );
        // Reset specific loading states if the trigger was for them but nothing fetched
        if (direction === "past") setIsFetchingMorePast(false);
        if (direction === "future") setIsFetchingMoreFuture(false);
        if (direction === "initial" && fetchingDatesRef.current.size === 0)
          setIsLoading(false);
        return;
      }

      // Add to fetching set
      datesActuallyNeedingFetch.forEach((date) =>
        fetchingDatesRef.current.add(date)
      );
      console.log(
        `Page Fetching meal data for dates (${direction}):`,
        datesActuallyNeedingFetch
      );

      // Set appropriate loading state based on direction
      if (direction === "initial") setIsLoading(true);
      if (direction === "past") setIsFetchingMorePast(true);
      if (direction === "future") setIsFetchingMoreFuture(true);
      if (direction === "specific" && !isLoading) setIsLoading(true); // Use general loading for specific fetches if not already loading

      // setError(null); // Don't reset error prematurely
      initialLoadAttemptedRef.current = true;

      try {
        const response = await fetchMealDays(userId, datesActuallyNeedingFetch);
        console.log(
          `Page API response received for (${direction}):`,
          datesActuallyNeedingFetch.join(", ")
        );

        let transformedData: DayMeals[] = [];
        // Check if day_plans is an object and not empty
        if (
          response.day_plans &&
          typeof response.day_plans === "object" &&
          Object.keys(response.day_plans).length > 0
        ) {
          transformedData = await transformApiResponseToDayMeals(response);
          // console.log("Page Data transformed:", transformedData.length, "days");

          // --- Update loaded range based on successfully transformed data ---
          const fetchedDates = transformedData
            .map((d) => normalizeDate(d.date))
            .filter(isValidDate);
          if (fetchedDates.length > 0) {
            const minFetched = minDate(fetchedDates);
            const maxFetched = maxDate(fetchedDates);
            if (
              !loadedStartDateRef.current ||
              minFetched < loadedStartDateRef.current
            ) {
              loadedStartDateRef.current = minFetched;
              console.log(
                "Page Updated loadedStartDateRef:",
                format(minFetched, "yyyy-MM-dd")
              );
            }
            if (
              !loadedEndDateRef.current ||
              maxFetched > loadedEndDateRef.current
            ) {
              loadedEndDateRef.current = maxFetched;
              console.log(
                "Page Updated loadedEndDateRef:",
                format(maxFetched, "yyyy-MM-dd")
              );
            }
          }
          // --- End Update loaded range ---
        } else {
          console.log(
            `Page No meal history found in response for requested dates (${direction}):`,
            datesActuallyNeedingFetch.join(", ")
          );
          // If no data found, still update the loaded range to prevent re-fetching these empty dates
          const requestedDates = datesActuallyNeedingFetch
            .map((d) => normalizeDate(d))
            .filter(isValidDate);
          if (requestedDates.length > 0) {
            const minRequested = minDate(requestedDates);
            const maxRequested = maxDate(requestedDates);
            if (
              !loadedStartDateRef.current ||
              minRequested < loadedStartDateRef.current
            ) {
              loadedStartDateRef.current = minRequested;
              console.log(
                "Page Updated loadedStartDateRef (no data):",
                format(minRequested, "yyyy-MM-dd")
              );
            }
            if (
              !loadedEndDateRef.current ||
              maxRequested > loadedEndDateRef.current
            ) {
              loadedEndDateRef.current = maxRequested;
              console.log(
                "Page Updated loadedEndDateRef (no data):",
                format(maxRequested, "yyyy-MM-dd")
              );
            }
          }
        }

        // Ensure placeholders are added for any requested dates *not* in the response
        // and not already added via transformation (if transformation handles empty days)
        const returnedDates = new Set(
          transformedData.map((d) =>
            format(normalizeDate(d.date), "yyyy-MM-dd")
          )
        );
        datesActuallyNeedingFetch.forEach((dateStr) => {
          if (!returnedDates.has(dateStr)) {
            const normalizedPlaceholderDate = normalizeDate(dateStr);
            if (isValidDate(normalizedPlaceholderDate)) {
              // console.log(`Page Adding placeholder for missing date: ${dateStr}`);
              transformedData.push({
                date: normalizedPlaceholderDate,
                meals: [],
              });
            } else {
              console.warn(
                `Page Skipping placeholder for invalid date string: ${dateStr}`
              );
            }
          }
        });

        // Merge data: Use a Map with normalized date strings as keys
        setWeekData((prevData) => {
          const dataMap = new Map<string, DayMeals>(
            prevData
              .map((day) => {
                const normalizedPrevDate = normalizeDate(day.date);
                return isValidDate(normalizedPrevDate)
                  ? ([format(normalizedPrevDate, "yyyy-MM-dd"), day] as [
                      string,
                      DayMeals
                    ])
                  : (["invalid", day] as [string, DayMeals]); // Handle potential invalid dates in prevData
              })
              .filter(([key]) => key !== "invalid") // Filter out invalid entries
          );

          transformedData.forEach((newDayData) => {
            // newDayData is from the API response for the specific fetched dates
            const normalizedDayDate = normalizeDate(newDayData.date); // Normalize once
            if (isValidDate(normalizedDayDate)) {
              const dateKey = format(normalizedDayDate, "yyyy-MM-dd");
              const existingDayData = dataMap.get(dateKey);

              if (existingDayData) {
                // Day exists: Merge meals carefully
                const combinedMealsMap = new Map<string, Meal>();

                // Add existing meals from the state first
                (existingDayData.meals || []).forEach((meal) => {
                  // Use meal.id which should be unique for each meal instance (trace or accepted rec)
                  if (meal.id) {
                    combinedMealsMap.set(meal.id, meal);
                  } else {
                    console.warn(
                      "Existing meal missing ID during merge:",
                      meal
                    );
                    // Handle fallback if needed, e.g., generate a temporary key, but ideally IDs are reliable
                  }
                });

                // Add or update with new meals from the API response
                (newDayData.meals || []).forEach((newMeal) => {
                  if (newMeal.id) {
                    // Check if a meal with this ID already exists in our map.
                    // If it doesn't, add the new meal.
                    // If it does, we keep the existing one to prevent overwrites due to potentially non-unique IDs
                    // generated based on backend data. This assumes the backend returns all relevant meals.
                    if (!combinedMealsMap.has(newMeal.id)) {
                      combinedMealsMap.set(newMeal.id, newMeal);
                      // console.log(`Page Merge: Added new meal ${newMeal.id} for date ${dateKey}`);
                    } else {
                      // Optional: Log that an overwrite was prevented.
                      // console.log(`Page Merge: Meal with ID ${newMeal.id} already exists for date ${dateKey}. Keeping existing entry.`);
                    }
                  } else {
                    console.warn("New meal missing ID during merge:", newMeal);
                  }
                });

                // Create the updated day object with merged meals
                const mergedDayData: DayMeals = {
                  ...existingDayData, // Keep potential original day info like _id if relevant
                  ...newDayData, // Overwrite with potentially new day info from API (if any, e.g., scores)
                  date: normalizedDayDate, // Ensure normalized date
                  meals: Array.from(combinedMealsMap.values()).sort((a, b) =>
                    a.time.localeCompare(b.time)
                  ), // Update meals list, sorted by time
                };
                dataMap.set(dateKey, mergedDayData);
                // console.log(`Page Merged meals for date: ${dateKey}. Total meals: ${mergedDayData.meals.length}`);
              } else {
                // Day doesn't exist in map yet, just add the new data
                dataMap.set(dateKey, {
                  ...newDayData,
                  date: normalizedDayDate,
                });
                // console.log(`Page Added new day data for date: ${dateKey}`);
              }
            } else {
              console.warn(
                "Page Skipping invalid date object during merge:",
                newDayData
              );
            }
          });

          // Sort the final array by date
          return Array.from(dataMap.values()).sort(
            (a, b) =>
              normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime() // Normalize for sort
          );
        });
        setError(null); // Clear error on success
      } catch (error: any) {
        console.error("Page Error fetching or transforming meal data:", error);
        setError(error.message || "Failed to load meal history.");

        // Add placeholders on error *only if data doesn't exist for those dates*
        setWeekData((prev) => {
          const dataMap = new Map<string, DayMeals>(
            prev
              .map((day) => {
                const normalizedPrevDate = normalizeDate(day.date);
                return isValidDate(normalizedPrevDate)
                  ? ([format(normalizedPrevDate, "yyyy-MM-dd"), day] as [
                      string,
                      DayMeals
                    ])
                  : (["invalid", day] as [string, DayMeals]);
              })
              .filter(([key]) => key !== "invalid")
          );

          datesActuallyNeedingFetch.forEach((dateStr) => {
            const normalizedDate = normalizeDate(dateStr);
            if (isValidDate(normalizedDate)) {
              const dateKey = format(normalizedDate, "yyyy-MM-dd");
              if (!dataMap.has(dateKey)) {
                // console.log(`Page Adding error placeholder for date: ${dateStr}`);
                dataMap.set(dateKey, { date: normalizedDate, meals: [] });
              }
            } else {
              console.warn(
                `Page Skipping error placeholder for invalid date string: ${dateStr}`
              );
            }
          });

          return Array.from(dataMap.values()).sort(
            (a, b) =>
              normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime()
          );
        });
      } finally {
        datesActuallyNeedingFetch.forEach((date) =>
          fetchingDatesRef.current.delete(date)
        );
        // Reset appropriate loading state
        if (direction === "initial") setIsLoading(false);
        if (direction === "past") setIsFetchingMorePast(false);
        if (direction === "future") setIsFetchingMoreFuture(false);
        if (direction === "specific" && fetchingDatesRef.current.size === 0)
          setIsLoading(false); // Reset general loading only if nothing else is fetching

        if (
          fetchingDatesRef.current.size === 0 &&
          !isFetchingMorePast &&
          !isFetchingMoreFuture
        ) {
          setIsLoading(false); // Ensure main loading is off if nothing is fetching
          console.log("Page All fetches complete. isLoading set to false.");
        }
        // else {
        // console.log("Page Fetch complete for:", datesActuallyNeedingFetch.join(', '), "Remaining fetches:", Array.from(fetchingDatesRef.current));
        // }
      }
    },
    [userId, isLoading, isFetchingMorePast, isFetchingMoreFuture] // Include new loading states
  );

  // Handler for deleting a trace meal
  const handleDeleteMeal = useCallback(
    async (mealIdToDelete: string, mealDate: Date) => {
      if (!userId) {
        showErrorModal(
          "Action Failed",
          "Cannot delete meal: User not logged in."
        );
        return;
      }
      if (!mealIdToDelete || !mealDate) {
        showErrorModal(
          "Action Failed",
          "Cannot delete meal: Missing meal ID or date."
        );
        console.error("handleDeleteMeal missing data:", {
          mealIdToDelete,
          mealDate,
        });
        return;
      }

      const normalizedMealDate = normalizeDate(mealDate);
      const dateStr = format(normalizedMealDate, "yyyy-MM-dd");
      console.log(
        `Page: Attempting to delete meal ${mealIdToDelete} on ${dateStr}`
      );
      const originalWeekData = [...weekData];

      // Optimistic UI Update
      setWeekData((prevData) => {
        const newData = prevData.map((day) => {
          // Find the correct day
          if (isSameDay(normalizeDate(day.date), normalizedMealDate)) {
            // Filter out the meal to be deleted
            const updatedMeals = day.meals.filter(
              (meal) => meal.id !== mealIdToDelete
            );
            // Return the updated day object
            return { ...day, meals: updatedMeals };
          }
          // Return unchanged day if it's not the target date
          return day;
        });
        // Filter out days that might become empty (optional, depends on desired behavior)
        // return newData.filter(day => day.meals.length > 0);
        return newData;
      });
      console.log(
        `Page: Optimistically removed meal ${mealIdToDelete} from UI.`
      );
      setError(null); // Clear previous errors

      // Call Backend API
      try {
        await deleteMealFromTrace(userId, dateStr, mealIdToDelete);
        console.log(
          `Page: Successfully deleted meal ${mealIdToDelete} from backend.`
        );
        // UI is already updated, no further action needed on success
      } catch (err: any) {
        console.error(`Page: Error deleting meal ${mealIdToDelete}:`, err);
        setWeekData(originalWeekData); // Rollback
        const errorMsg =
          err instanceof ApiError
            ? `Delete failed: ${err.message}`
            : "An unexpected error occurred while deleting the meal.";
        showErrorModal("Deletion Error", errorMsg); // Use modal for error feedback
        setError(errorMsg); // Also set state error if needed elsewhere
      }
    },
    [userId, weekData, showErrorModal]
  );

  const handleRegeneratePartial = useCallback(
    async (datesToRegenerate: string[]) => {
      if (!userId) {
        setError("Cannot regenerate meals: User not logged in.");
        return;
      }
      if (datesToRegenerate.length === 0) {
        console.log("Page: No dates provided for regeneration.");
        return;
      }

      console.log(
        "Page: handleRegeneratePartial called for dates:",
        datesToRegenerate.join(", ")
      );
      setIsRegenerating(true);
      setError(null);

      try {
        const response = await regeneratePartialMeals(
          userId,
          datesToRegenerate
        );
        console.log("Page: Regeneration API response received.");

        // Update localStorage["mealPlan"]
        const rawMealPlanString = localStorage.getItem("mealPlan");
        let currentMealPlan: any = { days: {} }; // Default structure

        if (rawMealPlanString) {
          try {
            currentMealPlan = JSON.parse(rawMealPlanString);
            // Basic validation
            if (
              typeof currentMealPlan !== "object" ||
              currentMealPlan === null ||
              !currentMealPlan.days ||
              typeof currentMealPlan.days !== "object"
            ) {
              console.warn(
                "Page: Invalid mealPlan structure in localStorage during regeneration. Resetting."
              );
              // Keep essential top-level fields if they exist, otherwise reset days
              currentMealPlan = {
                _id: currentMealPlan?._id,
                user_id: currentMealPlan?.user_id,
                name: currentMealPlan?.name,
                scores: currentMealPlan?.scores,
                days: {}, // Reset days
              };
            }
          } catch (e) {
            console.error(
              "Page: Failed to parse mealPlan from localStorage during regeneration:",
              e
            );

            // Attempt to preserve top-level fields if possible during reset
            const tempPlan = localStorage.getItem("mealPlan");
            let parsedTemp = {};
            try {
              parsedTemp = tempPlan ? JSON.parse(tempPlan) : {};
            } catch {}
            currentMealPlan = {
              _id: (parsedTemp as any)?._id,
              user_id: (parsedTemp as any)?._user_id,
              name: (parsedTemp as any)?._name,
              scores: (parsedTemp as any)?._scores,
              days: {}, // Reset days
            };
          }
        } else {
          // If no plan exists, initialize with a basic structure
          currentMealPlan = { user_id: userId, days: {} };
        }

        // Merge the regenerated days into the current meal plan's 'days' object
        // The response 'days' object contains the *new* meal data for the regenerated dates
        for (const [dateStr, dayDataFromResponse] of Object.entries(
          response.days
        )) {
          // dayDataFromResponse structure: { _id, meals, user_id } from RegenerateApiResponse
          if (dayDataFromResponse && Array.isArray(dayDataFromResponse.meals)) {
            // Get the existing day structure from localStorage plan (if any)
            // This structure should match BanditDayData: { _id, meals, user_id, meal_plan_id }
            const existingDayStorage = currentMealPlan.days[dateStr] || {};

            // Create the updated day structure for localStorage
            // Prioritize keeping existing IDs if available, update meals array
            currentMealPlan.days[dateStr] = {
              _id: existingDayStorage._id || dayDataFromResponse._id, // Keep existing day ID or use new one
              meals: dayDataFromResponse.meals, // *** Replace meals array entirely with the new recommendations ***
              user_id:
                existingDayStorage.user_id ||
                dayDataFromResponse.user_id ||
                userId, // Ensure user_id
              meal_plan_id:
                existingDayStorage.meal_plan_id || currentMealPlan._id, // Ensure meal_plan_id links back
              // Include scores if they come back from regeneration API, otherwise clear them for the day?
              // Assuming regeneration API doesn't return day-level scores, clear them:
              // variety_score: undefined,
              // item_coverage_score: undefined,
              // nutritional_constraint_score: undefined,
            };
            console.log(
              `Page: Updated recommendations in localStorage for ${dateStr}. New meal count: ${dayDataFromResponse.meals.length}`
            );
          } else {
            console.warn(
              `Page: Received invalid day data for ${dateStr} in regeneration response. Skipping update for this date.`
            );
          }
        }

        // Save the updated meal plan back to localStorage
        localStorage.setItem("mealPlan", JSON.stringify(currentMealPlan));
        console.log(
          "Page: Updated localStorage['mealPlan'] after regeneration."
        );

        // The MealCalendarViz component will automatically re-render and update
        // its recommendations based on the change to the 'mealPlan' prop derived from localStorage.
      } catch (err: any) {
        console.error("Page: Error during meal regeneration:", err);
        if (err instanceof ApiError) {
          setError(
            `Regeneration failed: ${err.message} (Status: ${
              err.statusCode || "N/A"
            })`
          );
        } else {
          setError("An unexpected error occurred during regeneration.");
        }
      } finally {
        setIsRegenerating(false);
      }
    },
    [userId]
  );

  const handleSaveMeal = useCallback(
    async (payload: SaveMealPayload): Promise<boolean> => {
      const { userId: reqUserId, date, mealId } = payload;
      // Basic validation, though Viz should ensure these are present
      if (!reqUserId || !date || !mealId) {
        console.error(
          "Page: handleSaveMeal received invalid payload:",
          payload
        );
        setError("Cannot save meal: Missing required information.");
        return false;
      }

      // Optionally add a loading state specific to saving if needed
      // setIsLoading(true); // Or a more specific saving state
      setError(null);

      try {
        const success = await saveMealToTrace(reqUserId, date, mealId);
        if (success) {
          console.log(
            `Page: Successfully initiated save for meal ${mealId} on ${date}.`
          );
          // The Viz component handles localStorage removal *after* this succeeds.
          // The Viz component also triggers the refetch via onRequestFetch.
          return true;
        } else {
          // This case might not be reached if saveMealToTrace throws on failure
          console.warn(
            `Page: saveMealToTrace reported failure for meal ${mealId}.`
          );
          setError(
            "Failed to save the meal to your history. Please try again."
          );
          return false;
        }
      } catch (err: any) {
        console.error(`Page: Error saving meal ${mealId}:`, err);
        if (err instanceof ApiError) {
          setError(`Save failed: ${err.message}`);
        } else {
          setError("An unexpected error occurred while saving the meal.");
        }
        return false; // Indicate failure
      } finally {
        // Optionally stop the specific saving loading state
        // setIsLoading(false);
      }
    },
    [] // No dependencies needed as it uses payload and calls service
  );

  const handleFavoriteMeal = useCallback(
    async (mealIdToFavorite: string, mealDate: Date) => {
      if (!userId) {
        showErrorModal(
          "Action Failed",
          "Cannot favorite meal: User not logged in."
        ); // Use modal
        return;
      }
      if (!mealIdToFavorite || !mealDate) {
        showErrorModal(
          "Action Failed",
          "Cannot favorite meal: Missing meal ID or date."
        ); // Use modal
        console.error("handleFavoriteMeal missing data:", {
          mealIdToFavorite,
          mealDate,
        });
        return;
      }

      const normalizedMealDate = normalizeDate(mealDate);
      const dateStr = format(normalizedMealDate, "yyyy-MM-dd");

      console.log(
        `Page: Attempting to favorite meal ${mealIdToFavorite} on ${dateStr}`
      );
      setError(null); // Clear previous errors

      // Call Backend API
      try {
        await favoriteMealInTrace(userId, dateStr, mealIdToFavorite);
        console.log(
          `Page: Successfully favorited meal ${mealIdToFavorite} on backend.`
        );
        // Show success feedback using the modal
        showSuccessModal(
          "Meal Favorited",
          "This meal has been marked as a favorite and will influence future recommendations."
        );

        // Optional: Optimistic UI update (if Meal type has isFavorited)
        // setWeekData(prevData => {
        //   return prevData.map(day => {
        //     if (isSameDay(normalizeDate(day.date), normalizedMealDate)) {
        //       return {
        //         ...day,
        //         meals: day.meals.map(meal =>
        //           meal.id === mealIdToFavorite ? { ...meal, isFavorited: true } : meal
        //         ),
        //       };
        //     }
        //     return day;
        //   });
        // });
      } catch (err: any) {
        console.error(`Page: Error favoriting meal ${mealIdToFavorite}:`, err);
        const errorMsg =
          err instanceof ApiError
            ? `Favorite failed: ${err.message}`
            : "An unexpected error occurred while favoriting the meal.";
        showErrorModal(
          "Favorite Error",
          `Could not mark meal as favorite. ${errorMsg}`
        ); // Use modal for error
        setError(errorMsg); // Set state error if needed
      }
    },
    [userId, showErrorModal, showSuccessModal]
  );

  // Callback for Viz to request fetching specific dates
  const handleFetchRequest = useCallback(
    (payload: FetchRequestPayload) => {
      const { datesToFetch, direction } = payload; // Destructure direction
      console.log(
        `Page handleFetchRequest received from Viz. Direction: ${direction}, Dates:`,
        datesToFetch.join(", ") || "None"
      );
      if (datesToFetch.length > 0) {
        fetchMealData(datesToFetch, direction); // Pass direction to fetch function
      }
    },
    [fetchMealData]
  );

  // Callback for Viz to signal a date change
  const handleDateSelect = useCallback(
    (newDate: Date) => {
      const normalizedNewDate = normalizeDate(newDate);
      // Use isSameDay for comparison after normalization
      if (!isSameDay(selectedDate, normalizedNewDate)) {
        // console.log("Page Updating selectedDate state to:", format(normalizedNewDate, "yyyy-MM-dd"));
        setSelectedDate(normalizedNewDate);
        // Fetch data around the newly selected date if it's outside the currently loaded range
        if (loadedStartDateRef.current && loadedEndDateRef.current) {
          if (
            normalizedNewDate < loadedStartDateRef.current ||
            normalizedNewDate > loadedEndDateRef.current
          ) {
            console.log(
              "Page Selected date outside loaded range. Fetching surrounding data."
            );
            const fetchStart = subDays(normalizedNewDate, 3); // Fetch a window around the new date
            const fetchEnd = addDays(normalizedNewDate, 3);
            const datesToFetch = generateDateRange(fetchStart, fetchEnd);
            // Filter out dates already loaded
            const datesTrulyNeeded = datesToFetch.filter((dStr) => {
              const d = normalizeDate(dStr);
              return (
                d < loadedStartDateRef.current! || d > loadedEndDateRef.current!
              );
            });
            if (datesTrulyNeeded.length > 0) {
              fetchMealData(datesTrulyNeeded, "specific"); // Fetch as 'specific'
            }
          }
        }
      }
      // else {
      // console.log("Page Date selected is the same as current. No state update.");
      // }
    },
    [selectedDate, fetchMealData] // Add fetchMealData dependency
  );

  // Initial data load effect (runs once)
  useEffect(() => {
    // Ensure userId is present before initial load
    if (!initialLoadAttemptedRef.current && userId) {
      console.log("Page Initial load effect running.");
      initialLoadAttemptedRef.current = true; // Mark attempt even before fetch starts
      // Use the initial selectedDate state (already normalized)
      // Fetch a wider initial range for infinite scroll
      const initialStart = subDays(selectedDate, 7); // e.g., 7 days back
      const initialEnd = addDays(selectedDate, 7); // e.g., 7 days forward
      loadedStartDateRef.current = initialStart; // Initialize refs
      loadedEndDateRef.current = initialEnd;
      const initialDatesToFetch = generateDateRange(initialStart, initialEnd);
      fetchMealData(initialDatesToFetch, "initial"); // Pass 'initial' direction
    } else if (!userId) {
      // console.log("Page Initial load effect waiting for userId.");
      setIsLoading(false); // Stop loading if no user ID
      setWeekData([]); // Clear any existing data
      setError("Please log in to view your meal plan."); // Set error message
    }
  }, [userId, selectedDate, fetchMealData]);

  // Render Logic

  // Combined loading state check
  const showLoadingScreen =
    (isLoading || isLoadingGoals) && !initialLoadAttemptedRef.current;

  // Use specific loading states for the overlay when scrolling, otherwise use general loading/regenerating
  const showOverlayLoader =
    (isFetchingMorePast ||
      isFetchingMoreFuture ||
      isRegenerating ||
      (isLoading && initialLoadAttemptedRef.current)) &&
    !showLoadingScreen;

  // Loading/Error/Main render logic remains largely the same, just uses the new loading states
  if (showLoadingScreen) {
    return (
      <MainLayout title="Meal Calendar" subtitle="Loading your data...">
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          {/* Use primary color for spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513]" />
        </div>
      </MainLayout>
    );
  }

  // Show error screen (keep existing logic)
  if (error && !userId) {
    // Show login error prominently
    return (
      <MainLayout title="Meal Calendar" subtitle="Access Denied">
        <div className="flex items-center justify-center h-[calc(100vh-150px)] text-[#D9534F]">
          {" "}
          {/* Accent Red */}
          <div className="text-center">
            <p className="text-xl mb-4">Login Required</p>
            <p>{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  } else if (error) {
    // Show other errors
    return (
      <MainLayout title="Meal Calendar" subtitle="Error">
        <div className="flex items-center justify-center h-[calc(100vh-150px)] text-[#D9534F]">
          {" "}
          {/* Accent Red */}
          <div className="text-center">
            <p className="text-xl mb-4">Error Loading Data</p>
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                // Retry fetching data around the currently selected date
                const retryStart = subDays(selectedDate, 7); // Retry wider range
                const retryEnd = addDays(selectedDate, 7);
                const datesToFetch = generateDateRange(retryStart, retryEnd);
                fetchMealData(datesToFetch, "initial"); // Retry fetching meal data
                // Optionally retry fetching goals if needed
                if (!nutritionalGoals && userId) {
                  // loadGoals(); // Need to extract loadGoals or call fetchNutritionalGoals directly
                  fetchNutritionalGoals(userId).then(setNutritionalGoals);
                }
              }}
              className="mt-4 px-4 py-2 bg-[#8B4513] text-white rounded-md hover:bg-[#A0522D]" // Primary color button
            >
              {" "}
              Retry{" "}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Ensure mealPlan from localStorage is parsed safely
  let mealPlan = {};
  try {
    const storedPlan = localStorage.getItem("mealPlan");
    if (storedPlan) {
      mealPlan = JSON.parse(storedPlan);
      // Basic validation: check if it has a 'days' object
      if (
        typeof mealPlan !== "object" ||
        mealPlan === null ||
        !("days" in mealPlan) ||
        typeof (mealPlan as any).days !== "object"
      ) {
        console.warn(
          "Invalid mealPlan structure in localStorage. Resetting.",
          mealPlan
        );
        localStorage.removeItem("mealPlan");
        mealPlan = {};
      }
    }
  } catch (e) {
    console.error("Failed to parse mealPlan from localStorage:", e);
    localStorage.removeItem("mealPlan"); // Clear invalid data
    mealPlan = {};
  }

  // Provide default goals if fetch failed or returned null
  const finalNutritionalGoals = nutritionalGoals ?? {
    dailyCalories: 2000,
    carbohydrates: { daily: 250, unit: "g" },
    protein: { daily: 100, unit: "g" },
    fiber: { daily: 30, unit: "g" },
  };

  return (
    <MainLayout
      title="Meal Calendar"
      subtitle="Plan and Track Your Meals With Ease"
    >
      <MealCalendarViz
        mealData={weekData} // This is the source of truth from the parent
        userPreferences={userPreferences}
        nutritionalGoals={finalNutritionalGoals} // Pass final goals
        mealPlan={mealPlan} // Pass parsed meal plan
        onRequestFetch={handleFetchRequest} // Pass fetch handler
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
        onRegeneratePartial={handleRegeneratePartial}
        isRegenerating={isRegenerating}
        onSaveMeal={handleSaveMeal}
        onDeleteMeal={handleDeleteMeal}
        onFavoriteMeal={handleFavoriteMeal}
        userId={userId}
        // Pass loading states for infinite scroll indicators
        isFetchingPast={isFetchingMorePast}
        isFetchingFuture={isFetchingMoreFuture}
        // Pass loaded date range boundaries
        loadedStartDate={loadedStartDateRef.current}
        loadedEndDate={loadedEndDateRef.current}
      />
      {/* Overlay loader uses combined logic */}
      {showOverlayLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 pointer-events-none">
          {/* Use primary color for spinner */}
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8B4513]"></div>
        </div>
      )}
      {modalConfig && <CustomModal {...modalConfig} />}
    </MainLayout>
  );
};

export default MealTimelinePage;

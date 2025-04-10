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
} from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { ApiError } from "../utils/errorHandling";

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
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    normalizeDate(new Date())
  );
  const [nutritionalGoals, setNutritionalGoals] =
    useState<NutritionalGoals | null>(null); // State for goals

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
  const [userAnthropometrics] = useState<UserAnthropometrics>({
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

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      try {
        const rawMealPlanString = localStorage.getItem("mealPlan");
        if (rawMealPlanString) {
          const mealPlan = JSON.parse(rawMealPlanString);
          // Check if there are any days with meals in the plan
          if (mealPlan && mealPlan.days && typeof mealPlan.days === "object") {
            const hasUnsavedMeals = Object.values(mealPlan.days).some(
              (day: any) =>
                day && Array.isArray(day.meals) && day.meals.length > 0
            );
            if (hasUnsavedMeals) {
              console.log(
                "Unsaved recommendations detected in localStorage. Prompting user."
              );
              event.preventDefault(); // Standard practice
              event.returnValue =
                "You have unsaved meal recommendations. Are you sure you want to leave? They will be lost."; // For older browsers
              return "You have unsaved meal recommendations. Are you sure you want to leave? They will be lost."; // For modern browsers
            }
          }
        }
      } catch (e) {
        console.error(
          "Error checking localStorage for unsaved recommendations:",
          e
        );
        // Don't block navigation if there's an error reading localStorage
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

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
    async (datesToFetchParam: string[]) => {
      // Filter out dates already being fetched
      const datesActuallyNeedingFetch = datesToFetchParam.filter(
        (dateStr) => !fetchingDatesRef.current.has(dateStr)
      );

      if (datesActuallyNeedingFetch.length === 0) {
        console.log(
          "Page Fetch skipped: Dates already being fetched or empty list.",
          datesToFetchParam
        );
        if (isLoading && fetchingDatesRef.current.size === 0) {
          setIsLoading(false); // Stop loading if nothing is actually fetching
        }
        return;
      }

      // Add to fetching set
      datesActuallyNeedingFetch.forEach((date) =>
        fetchingDatesRef.current.add(date)
      );
      console.log(
        "Page Fetching meal data for dates:",
        datesActuallyNeedingFetch
      );
      if (!isLoading) setIsLoading(true); // Ensure loading is true
      // setError(null); // Don't reset error prematurely
      initialLoadAttemptedRef.current = true;

      try {
        const response = await fetchMealDays(userId, datesActuallyNeedingFetch);
        console.log(
          "Page API response received for:",
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
        } else {
          console.log(
            "Page No meal history found in response for requested dates:",
            datesActuallyNeedingFetch.join(", ")
          );
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
        if (fetchingDatesRef.current.size === 0) {
          setIsLoading(false);
          // console.log("Page All fetches complete. isLoading set to false.");
        }
        // else {
        // console.log("Page Fetch complete for:", datesActuallyNeedingFetch.join(', '), "Remaining fetches:", Array.from(fetchingDatesRef.current));
        // }
      }
    },
    [userId, isLoading]
  );

  // Handler for deleting a trace meal
  const handleDeleteMeal = useCallback(
    async (mealIdToDelete: string, mealDate: Date) => {
      if (!userId) {
        setError("Cannot delete meal: User not logged in.");
        return;
      }
      if (!mealIdToDelete || !mealDate) {
        setError("Cannot delete meal: Missing meal ID or date.");
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

      // Store original data for potential rollback
      const originalWeekData = [...weekData]; // Shallow copy is enough here

      // --- Optimistic UI Update ---
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

      // --- Call Backend API ---
      try {
        await deleteMealFromTrace(userId, dateStr, mealIdToDelete);
        console.log(
          `Page: Successfully deleted meal ${mealIdToDelete} from backend.`
        );
        // UI is already updated, no further action needed on success
      } catch (err: any) {
        console.error(`Page: Error deleting meal ${mealIdToDelete}:`, err);
        // --- Rollback UI on Failure ---
        setWeekData(originalWeekData); // Restore previous state
        if (err instanceof ApiError) {
          setError(`Delete failed: ${err.message}`);
        } else {
          setError("An unexpected error occurred while deleting the meal.");
        }
      }
    },
    [userId, weekData] // Add weekData dependency for rollback
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
        setError("Cannot favorite meal: User not logged in.");
        return;
      }
      if (!mealIdToFavorite || !mealDate) {
        setError("Cannot favorite meal: Missing meal ID or date.");
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

      // --- Call Backend API ---
      try {
        await favoriteMealInTrace(userId, dateStr, mealIdToFavorite);
        console.log(
          `Page: Successfully favorited meal ${mealIdToFavorite} on backend.`
        );
        // Optional: Show a success toast/message to the user
        alert(`Meal marked as favorite! This will influence future recommendations.`);

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
        if (err instanceof ApiError) {
          setError(`Favorite failed: ${err.message}`);
        } else {
          setError("An unexpected error occurred while favoriting the meal.");
        }
        // Optional: Show an error toast/message
        alert(`Error: Could not mark meal as favorite. ${err.message || ''}`);
      }
    },
    [userId] // Dependency on userId
  );

  // Callback for Viz to request fetching specific dates
  const handleFetchRequest = useCallback(
    (payload: FetchRequestPayload) => {
      const { datesToFetch } = payload;
      // console.log("Page handleFetchRequest received from Viz. Dates:", datesToFetch.join(', ') || 'None');
      if (datesToFetch.length > 0) {
        fetchMealData(datesToFetch);
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
      }
      // else {
      // console.log("Page Date selected is the same as current. No state update.");
      // }
    },
    [selectedDate]
  );

  // Initial data load effect (runs once)
  useEffect(() => {
    // Ensure userId is present before initial load
    if (!initialLoadAttemptedRef.current && userId) {
      console.log("Page Initial load effect running.");
      initialLoadAttemptedRef.current = true; // Mark attempt even before fetch starts
      // Use the initial selectedDate state (already normalized)
      const initialStart = subDays(selectedDate, 3);
      const initialEnd = addDays(selectedDate, 3);
      const initialDatesToFetch = generateDateRange(initialStart, initialEnd);
      fetchMealData(initialDatesToFetch);
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
  // Use isRegenerating OR isLoading for the overlay
  const showOverlayLoader =
    (isLoading || isLoadingGoals || isRegenerating) &&
    initialLoadAttemptedRef.current;

  if (showLoadingScreen) {
    return (
      <MainLayout title="Meal Calendar" subtitle="Loading your data...">
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </MainLayout>
    );
  }

  // Show error screen (keep existing logic)
  if (error && !userId) {
    // Show login error prominently
    return (
      <MainLayout title="Meal Calendar" subtitle="Access Denied">
        <div className="flex items-center justify-center h-[calc(100vh-150px)] text-red-500">
          <div className="text-center">
            <p className="text-xl mb-4">Login Required</p>
            <p>{error}</p>
            {/* Add a login button? */}
          </div>
        </div>
      </MainLayout>
    );
  } else if (error) {
    // Show other errors
    return (
      <MainLayout title="Meal Calendar" subtitle="Error">
        <div className="flex items-center justify-center h-[calc(100vh-150px)] text-red-500">
          <div className="text-center">
            <p className="text-xl mb-4">Error Loading Data</p>
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                // Retry fetching data around the currently selected date
                const retryStart = subDays(selectedDate, 3);
                const retryEnd = addDays(selectedDate, 3);
                const datesToFetch = generateDateRange(retryStart, retryEnd);
                fetchMealData(datesToFetch); // Retry fetching meal data
                // Optionally retry fetching goals if needed
                if (!nutritionalGoals && userId) {
                  // loadGoals(); // Need to extract loadGoals or call fetchNutritionalGoals directly
                  fetchNutritionalGoals(userId).then(setNutritionalGoals);
                }
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
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
        onRequestFetch={handleFetchRequest}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
        onRegeneratePartial={handleRegeneratePartial}
        isRegenerating={isRegenerating}
        onSaveMeal={handleSaveMeal}
        onDeleteMeal={handleDeleteMeal}
        onFavoriteMeal={handleFavoriteMeal}
        userId={userId}
      />
      {showOverlayLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </MainLayout>
  );
};

export default MealTimelinePage;

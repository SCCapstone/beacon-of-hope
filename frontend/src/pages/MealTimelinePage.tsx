import React, { useState, useEffect, useCallback, useRef } from "react";
import MealCalendarViz from "../components/MealTimeline/MealCalendarViz";
import {
  DayMeals,
  UserPreferences,
  UserAnthropometrics,
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
  unfavoriteMealInTrace,
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

// Helper function to normalize dates consistently
const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    // console.warn(
    //   "MealTimeLinePage normalizeDate received null/undefined, returning current date."
    // );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  // Handle string parsing carefully, assuming 'yyyy-MM-dd' or ISO format
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    // console.warn(
    //   "MealTimeLinePage normalizeDate received invalid date, returning current date:",
    //   date
    // );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  // Set hours to 0 to compare dates only
  const normalized = new Date(dateObj);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Function to determine the initial selected date based on recommendations or today
const getInitialSelectedDate = (): Date => {
  const today = normalizeDate(new Date());
  try {
    const rawMealPlanString = localStorage.getItem("mealPlan");
    if (rawMealPlanString) {
      const mealPlan = JSON.parse(rawMealPlanString);
      if (mealPlan && mealPlan.days && typeof mealPlan.days === "object") {
        const recommendationDates = Object.keys(mealPlan.days)
          .map(normalizeDate) // Normalize date strings to Date objects
          .filter(isValidDate); // Filter out any invalid dates

        if (recommendationDates.length > 0) {
          const firstRecommendationDate = minDate(recommendationDates);
          // console.log(
          //   "MealTimelinePage: Found recommendations, setting initial date to:",
          //   format(firstRecommendationDate, "yyyy-MM-dd")
          // );
          return firstRecommendationDate;
        }
      }
    }
  } catch (e) {
    console.error(
      "MealTimelinePage: Error reading or parsing mealPlan from localStorage:",
      e
    );
    // Fall through to return today's date if error occurs
  }
  // console.log(
  //   "MealTimelinePage: No recommendations found or error, setting initial date to today:",
  //   format(today, "yyyy-MM-dd")
  // );
  return today; // Default to today if no recommendations or error
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
  nl_recommendations: string[];
};

export const MealTimelinePage: React.FC = () => {
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [isLoadingGoals, setIsLoadingGoals] = useState(true); // Specific loading for goals
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFetchingMorePast, setIsFetchingMorePast] = useState(false); // Specific loading state for past
  const [isFetchingMoreFuture, setIsFetchingMoreFuture] = useState(false); // Specific loading state for future
  const [error, setError] = useState<string | null>(null);
  // Use the helper function to initialize selectedDate
  const [selectedDate, setSelectedDate] = useState<Date>(
    getInitialSelectedDate
  );
  const [nutritionalGoals, setNutritionalGoals] =
    useState<NutritionalGoals | null>(null); // State for goals
  const [modalConfig, setModalConfig] = useState<ModalProps | null>(null);
  // Track the overall loaded range
  const loadedStartDateRef = useRef<Date | null>(null);
  const loadedEndDateRef = useRef<Date | null>(null);

  const initialLoadAttemptedRef = useRef(false);
  const fetchingDatesRef = useRef<Set<string>>(new Set());
  const [mealPlanForRegen, setMealPlanForRegen] = useState<any>(null);
  const userId = useSelector((state: RootState) => state.user.user?._id || "");
  const [initialLoadScrollTrigger, setInitialLoadScrollTrigger] = useState(0);
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

  // Effect to load mealPlan from localStorage once
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem("mealPlan");
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        // Basic validation
        if (
          typeof parsedPlan === "object" &&
          parsedPlan !== null &&
          "days" in parsedPlan &&
          typeof parsedPlan.days === "object"
        ) {
          setMealPlanForRegen(parsedPlan);
        } else {
          console.warn(
            "Page: Invalid mealPlan structure in localStorage on load. Clearing."
          );
          localStorage.removeItem("mealPlan");
          setMealPlanForRegen(null);
        }
      } else {
        setMealPlanForRegen(null);
      }
    } catch (e) {
      console.error(
        "Page: Failed to parse mealPlan from localStorage on load:",
        e
      );
      localStorage.removeItem("mealPlan"); // Clear invalid data
      setMealPlanForRegen(null);
    }
  }, []); // Run once on mount

  // Fetch Nutritional Goals
  useEffect(() => {
    const loadGoals = async () => {
      if (userId) {
        setIsLoadingGoals(true);
        try {
          // console.log("MealTimelinePage: Fetching nutritional goals...");
          const goals = await fetchNutritionalGoals(userId);
          setNutritionalGoals(goals); // Set goals (can be null if not found)
          // console.log("MealTimelinePage: Goals fetched:", goals);
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
        // console.log(
        //   "Page Fetch skipped: Dates already being fetched or empty list.",
        //   datesToFetchParam
        // );
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
      // console.log(
      //   `Page Fetching meal data for dates (${direction}):`,
      //   datesActuallyNeedingFetch
      // );

      // Set appropriate loading state based on direction
      if (direction === "initial") setIsLoading(true);
      if (direction === "past") setIsFetchingMorePast(true);
      if (direction === "future") setIsFetchingMoreFuture(true);
      if (direction === "specific" && !isLoading) setIsLoading(true); // Use general loading for specific fetches if not already loading

      // setError(null); // Don't reset error prematurely
      initialLoadAttemptedRef.current = true;

      try {
        const response = await fetchMealDays(userId, datesActuallyNeedingFetch);
        // console.log(
        //   `Page API response received for (${direction}):`,
        //   datesActuallyNeedingFetch.join(", ")
        // );

        let transformedData: DayMeals[] = [];
        // Check if day_plans is an object and not empty
        if (
          response.day_plans &&
          typeof response.day_plans === "object" &&
          Object.keys(response.day_plans).length > 0
        ) {
          transformedData = await transformApiResponseToDayMeals(response);
          // console.log("Page Data transformed:", transformedData.length, "days");

          // Update loaded range based on successfully transformed data
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
              // console.log(
              //   "Page Updated loadedStartDateRef:",
              //   format(minFetched, "yyyy-MM-dd")
              // );
            }
            if (
              !loadedEndDateRef.current ||
              maxFetched > loadedEndDateRef.current
            ) {
              loadedEndDateRef.current = maxFetched;
              // console.log(
              //   "Page Updated loadedEndDateRef:",
              //   format(maxFetched, "yyyy-MM-dd")
              // );
            }
          }
          // End Update loaded range
        } else {
          // console.log(
          //   `Page No meal history found in response for requested dates (${direction}):`,
          //   datesActuallyNeedingFetch.join(", ")
          // );
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
              // console.log(
              //   "Page Updated loadedStartDateRef (no data):",
              //   format(minRequested, "yyyy-MM-dd")
              // );
            }
            if (
              !loadedEndDateRef.current ||
              maxRequested > loadedEndDateRef.current
            ) {
              loadedEndDateRef.current = maxRequested;
              // console.log(
              //   "Page Updated loadedEndDateRef (no data):",
              //   format(maxRequested, "yyyy-MM-dd")
              // );
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

          // Process the transformed data from the current fetch
          transformedData.forEach((newDayData) => {
            // newDayData is from the API response for the specific fetched dates
            const normalizedDayDate = normalizeDate(newDayData.date); // Normalize once
            if (isValidDate(normalizedDayDate)) {
              const dateKey = format(normalizedDayDate, "yyyy-MM-dd");
              // *** Replace the entire entry for this date with the newly fetched data ***
              // This ensures optimistic entries are overwritten by the source of truth from the backend.
              dataMap.set(dateKey, {
                ...newDayData, // Use the structure from transformedData
                date: normalizedDayDate, // Ensure normalized date
                // Ensure meals are sorted if transformApiResponseToDayMeals doesn't already do it
                meals: (newDayData.meals || []).sort((a, b) =>
                  a.time.localeCompare(b.time)
                ),
              });
              // console.log(
              //   `Page: Updated/Set data for date: ${dateKey} with ${
              //     newDayData.meals?.length || 0
              //   } meals.`
              // );
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
        if (direction === "initial") {
           setIsLoading(false);
           setInitialLoadScrollTrigger(prev => prev + 1);
           console.log("Page: Initial fetch complete, triggering initial scroll.");
        }
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
          // console.log("Page All fetches complete. isLoading set to false.");
        }
        // else {
        // console.log("Page Fetch complete for:", datesActuallyNeedingFetch.join(', '), "Remaining fetches:", Array.from(fetchingDatesRef.current));
        // }
      }
    },
    [userId, isLoading, isFetchingMorePast, isFetchingMoreFuture]
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
      // console.log(
      //   `Page: Attempting to delete meal ${mealIdToDelete} on ${dateStr}`
      // );
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
      // console.log(
      //   `Page: Optimistically removed meal ${mealIdToDelete} from UI.`
      // );
      setError(null); // Clear previous errors

      // Call Backend API
      try {
        await deleteMealFromTrace(userId, dateStr, mealIdToDelete);
        // console.log(
        //   `Page: Successfully deleted meal ${mealIdToDelete} from backend.`
        // );
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
        // console.log("Page: No dates provided for regeneration.");
        return;
      }

      // Get mealPlanName from state (loaded from localStorage)
      const currentMealPlan = mealPlanForRegen; // Use state variable
      const mealPlanName = currentMealPlan?.name; // Get name from parsed plan

      if (!mealPlanName) {
        showErrorModal(
          "Regeneration Error",
          "Could not find the name of the current meal plan. Unable to regenerate."
        );
        console.error(
          "Page: mealPlanName not found in state for regeneration.",
          currentMealPlan
        );
        return;
      }

      setIsRegenerating(true);
      setError(null);

      try {
        // Pass mealPlanName to the service function
        const response = await regeneratePartialMeals(
          userId,
          mealPlanName,
          datesToRegenerate
        );
        // console.log("Page: Regeneration API response received.");

        // Use functional update for setMealPlanForRegen to ensure we have the latest state
        setMealPlanForRegen((prevPlan: any) => {
          let updatedPlan = prevPlan
            ? { ...prevPlan }
            : { user_id: userId, name: mealPlanName, days: {} }; // Start with previous or new
          if (!updatedPlan.days) updatedPlan.days = {}; // Ensure days object exists

          // Merge regenerated days
          for (const [dateStr, dayDataFromResponse] of Object.entries(
            response.days
          )) {
            if (
              dayDataFromResponse &&
              Array.isArray(dayDataFromResponse.meals)
            ) {
              const existingDayStorage = updatedPlan.days[dateStr] || {};
              updatedPlan.days[dateStr] = {
                _id: existingDayStorage._id || dayDataFromResponse._id,
                meals: dayDataFromResponse.meals,
                user_id:
                  existingDayStorage.user_id ||
                  dayDataFromResponse.user_id ||
                  userId,
                meal_plan_id:
                  existingDayStorage.meal_plan_id || updatedPlan._id,
              };
            } else {
              console.warn(
                `Page: Received invalid day data for ${dateStr} in regeneration response. Skipping update.`
              );
            }
          }

          // Save back to localStorage
          try {
            localStorage.setItem("mealPlan", JSON.stringify(updatedPlan));
            console.log(
              "Page: Updated localStorage['mealPlan'] after regeneration."
            );
          } catch (e) {
            console.error(
              "Page: Failed to save updated mealPlan to localStorage:",
              e
            );
            // Optionally show an error, but the state update below will still happen
          }
          return updatedPlan; // Return the updated plan for the state
        });
      } catch (err: any) {
        console.error("Page: Error during meal regeneration:", err);
        const errorMsg =
          err instanceof ApiError
            ? `Regeneration failed: ${err.message}`
            : "An unexpected error occurred during regeneration.";
        showErrorModal("Regeneration Error", errorMsg); // Use modal
        setError(errorMsg);
      } finally {
        setIsRegenerating(false);
      }
    },
    [userId, mealPlanForRegen, showErrorModal]
  );

  const handleSaveMeal = useCallback(
    async (payload: SaveMealPayload): Promise<boolean> => {
      const { userId: reqUserId, date, mealId, nl_recommendations } = payload;
      // Basic validation, though Viz should ensure these are present
      if (
        !reqUserId ||
        !date ||
        !mealId ||
        !Array.isArray(nl_recommendations)
      ) {
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
        const success = await saveMealToTrace(
          reqUserId,
          date,
          mealId,
          nl_recommendations
        );
        if (success) {
          // console.log(
          //   `Page: Successfully initiated save for meal ${mealId} on ${date}.`
          // );
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
        );
        return;
      }
      if (!mealIdToFavorite || !mealDate) {
        showErrorModal(
          "Action Failed",
          "Cannot favorite meal: Missing meal ID or date."
        );
        console.error("handleFavoriteMeal missing data:", {
          mealIdToFavorite,
          mealDate,
        });
        return;
      }

      const normalizedMealDate = normalizeDate(mealDate);
      const dateStr = format(normalizedMealDate, "yyyy-MM-dd");
      const originalWeekData = [...weekData]; // Store for potential rollback

      // console.log(
      //   `Page: Attempting to favorite meal ${mealIdToFavorite} on ${dateStr}`
      // );
      setError(null);

      // Optimistic UI Update (Optional but recommended for responsiveness)
      setWeekData((prevData) => {
        return prevData.map((day) => {
          if (isSameDay(normalizeDate(day.date), normalizedMealDate)) {
            return {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealIdToFavorite
                  ? { ...meal, isFavorited: true } // Assume favoriting action
                  : meal
              ),
            };
          }
          return day;
        });
      });
      // End Optimistic Update

      // Call Backend API
      try {
        await favoriteMealInTrace(userId, dateStr, mealIdToFavorite);
        // console.log(
        //   `Page: Successfully favorited meal ${mealIdToFavorite} on backend.`
        // );
        showSuccessModal(
          "Meal Favorited",
          "This meal has been marked as a favorite and will influence future recommendations."
        );

        // Confirm State Update (if not done optimistically, or to ensure consistency)
        // This ensures the state matches the backend even if optimistic update wasn't done
        setWeekData((prevData) => {
          return prevData.map((day) => {
            if (isSameDay(normalizeDate(day.date), normalizedMealDate)) {
              const mealExists = day.meals.some(
                (m) => m.id === mealIdToFavorite
              );
              if (mealExists) {
                return {
                  ...day,
                  meals: day.meals.map((meal) =>
                    meal.id === mealIdToFavorite
                      ? { ...meal, isFavorited: true } // Set to true after success
                      : meal
                  ),
                };
              }
            }
            return day;
          });
        });
        // End State Confirmation
      } catch (err: any) {
        console.error(`Page: Error favoriting meal ${mealIdToFavorite}:`, err);
        // Rollback Optimistic Update on Error
        setWeekData(originalWeekData);
        // End Rollback
        const errorMsg =
          err instanceof ApiError
            ? `Favorite failed: ${err.message}`
            : "An unexpected error occurred while favoriting the meal.";
        showErrorModal(
          "Favorite Error",
          `Could not mark meal as favorite. ${errorMsg}`
        );
        setError(errorMsg);
      }
    },
    [userId, weekData, showErrorModal, showSuccessModal] // Add weekData dependency for rollback
  );

  const handleUnfavoriteMeal = useCallback(
    async (mealIdToUnfavorite: string, mealDate: Date) => {
      if (!userId) {
        showErrorModal(
          "Action Failed",
          "Cannot unfavorite meal: User not logged in."
        );
        return;
      }
      if (!mealIdToUnfavorite || !mealDate) {
        showErrorModal(
          "Action Failed",
          "Cannot unfavorite meal: Missing meal ID or date."
        );
        console.error("handleUnfavoriteMeal missing data:", {
          mealIdToUnfavorite,
          mealDate,
        });
        return;
      }

      const normalizedMealDate = normalizeDate(mealDate);
      const dateStr = format(normalizedMealDate, "yyyy-MM-dd");
      const originalWeekData = [...weekData]; // Store for potential rollback

      // console.log(
      //   `Page: Attempting to unfavorite meal ${mealIdToUnfavorite} on ${dateStr}`
      // );
      setError(null);

      // Optimistic UI Update
      setWeekData((prevData) => {
        return prevData.map((day) => {
          if (isSameDay(normalizeDate(day.date), normalizedMealDate)) {
            return {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealIdToUnfavorite
                  ? { ...meal, isFavorited: false } // Set isFavorited to false
                  : meal
              ),
            };
          }
          return day;
        });
      });
      // End Optimistic Update

      // Call Backend API
      try {
        await unfavoriteMealInTrace(userId, dateStr, mealIdToUnfavorite);
        // console.log(
        //   `Page: Successfully unfavorited meal ${mealIdToUnfavorite} on backend.`
        // );
        showSuccessModal(
          "Meal Unfavorited",
          "This meal is no longer marked as a favorite."
        );

        // Confirm State Update
        setWeekData((prevData) => {
          return prevData.map((day) => {
            if (isSameDay(normalizeDate(day.date), normalizedMealDate)) {
              const mealExists = day.meals.some(
                (m) => m.id === mealIdToUnfavorite
              );
              if (mealExists) {
                return {
                  ...day,
                  meals: day.meals.map((meal) =>
                    meal.id === mealIdToUnfavorite
                      ? { ...meal, isFavorited: false } // Ensure it's false
                      : meal
                  ),
                };
              }
            }
            return day;
          });
        });
        // End State Confirmation
      } catch (err: any) {
        console.error(
          `Page: Error unfavoriting meal ${mealIdToUnfavorite}:`,
          err
        );
        // Rollback Optimistic Update on Error
        setWeekData(originalWeekData);
        // End Rollback
        const errorMsg =
          err instanceof ApiError
            ? `Unfavorite failed: ${err.message}`
            : "An unexpected error occurred while unfavoriting the meal.";
        showErrorModal(
          "Unfavorite Error",
          `Could not remove favorite status. ${errorMsg}`
        );
        setError(errorMsg);
      }
    },
    [userId, weekData, showErrorModal, showSuccessModal] // Add weekData dependency
  );

  // Callback for Viz to request fetching specific dates
  const handleFetchRequest = useCallback(
    (payload: FetchRequestPayload) => {
      const { datesToFetch, direction } = payload; // Destructure direction
      // console.log(
      //   `Page handleFetchRequest received from Viz. Direction: ${direction}, Dates:`,
      //   datesToFetch.join(", ") || "None"
      // );
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
            // console.log(
            //   "Page Selected date outside loaded range. Fetching surrounding data."
            // );
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
      // console.log("Page Initial load effect running.");
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
              className="mt-4 px-4 py-2 bg-pink-900 text-white rounded-md hover:bg-[#A0522D]" // Primary color button
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
        mealPlan={mealPlanForRegen}
        onRequestFetch={handleFetchRequest} // Pass fetch handler
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
        onRegeneratePartial={handleRegeneratePartial}
        isRegenerating={isRegenerating}
        onSaveMeal={handleSaveMeal}
        onDeleteMeal={handleDeleteMeal}
        onFavoriteMeal={handleFavoriteMeal}
        onUnfavoriteMeal={handleUnfavoriteMeal}
        userId={userId}
        // Pass loading states for infinite scroll indicators
        isFetchingPast={isFetchingMorePast}
        isFetchingFuture={isFetchingMoreFuture}
        // Pass loaded date range boundaries
        loadedStartDate={loadedStartDateRef.current}
        loadedEndDate={loadedEndDateRef.current}
        initialLoadScrollTrigger={initialLoadScrollTrigger}
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

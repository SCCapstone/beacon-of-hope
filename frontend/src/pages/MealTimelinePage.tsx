import React, { useState, useEffect, useCallback, useRef } from "react";
import MealCalendarViz from "../components/MealTimeline/MealCalendarViz";
import {
  DayMeals,
  UserPreferences,
  UserAnthropometrics,
} from "../components/MealTimeline/types";
import { MainLayout } from "../components/Layouts/MainLayout";
import {
  fetchMealDays,
  generateDateRange,
  transformApiResponseToDayMeals,
} from "../services/recipeService";
import { subDays, addDays, format, isSameDay, parseISO, isValid as isValidDate } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";

const nutritionalGoals = {
  dailyCalories: 1800,
  carbohydrates: {
    min: 45,
    max: 60,
    unit: "g/meal",
  },
  protein: {
    min: 20,
    max: 30,
    unit: "g/meal",
  },
  fiber: {
    daily: 25,
    unit: "g",
  },
};

const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
      console.warn("Page normalizeDate received null/undefined, returning current date.");
      const fallbackDate = new Date();
      fallbackDate.setHours(0, 0, 0, 0);
      return fallbackDate;
  }
  // Handle string parsing carefully, assuming 'yyyy-MM-dd' or ISO format
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
      console.warn("Page normalizeDate received invalid date, returning current date:", date);
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

export const MealTimelinePage: React.FC = () => {
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load
  const [error, setError] = useState<string | null>(null);
  // Ensure initial date is normalized
  const [selectedDate, setSelectedDate] = useState<Date>(
    normalizeDate(new Date())
  );

  const initialLoadAttemptedRef = useRef(false);
  const fetchingDatesRef = useRef<Set<string>>(new Set());

  const userId = useSelector((state: RootState) => state.user.user?._id || "");
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

  // Function to fetch meal data for a date range
  const fetchMealData = useCallback(
    async (datesToFetchParam: string[]) => {
      // Filter out dates already being fetched
      const datesActuallyNeedingFetch = datesToFetchParam.filter(
        (dateStr) => !fetchingDatesRef.current.has(dateStr)
      );

      if (datesActuallyNeedingFetch.length === 0) {
        console.log("Page Fetch skipped: Dates already being fetched or empty list.", datesToFetchParam);
        if (isLoading && fetchingDatesRef.current.size === 0) {
             setIsLoading(false); // Stop loading if nothing is actually fetching
        }
        return;
      }

      // Add to fetching set
      datesActuallyNeedingFetch.forEach(date => fetchingDatesRef.current.add(date));
      console.log("Page Fetching meal data for dates:", datesActuallyNeedingFetch);
      if (!isLoading) setIsLoading(true); // Ensure loading is true
      // setError(null); // Don't reset error prematurely
      initialLoadAttemptedRef.current = true;

      try {
        const response = await fetchMealDays(userId, datesActuallyNeedingFetch);
        console.log("Page API response received for:", datesActuallyNeedingFetch.join(', '));

        let transformedData: DayMeals[] = [];
        if (!response.day_plans || Object.keys(response.day_plans).length === 0) {
          console.log("Page No meal history found for requested dates:", datesActuallyNeedingFetch.join(', '));
          // Create placeholders ONLY for the dates requested in *this* fetch
          transformedData = datesActuallyNeedingFetch.map((dateStr) => ({
            date: normalizeDate(dateStr), // Use normalizeDate
            meals: [],
          })).filter(day => isValidDate(day.date)); // Filter invalid dates
        } else {
          transformedData = await transformApiResponseToDayMeals(response);
          console.log("Page Data transformed:", transformedData.length, "days");

          // Ensure placeholders are added for any requested dates *not* in the response
          const returnedDates = new Set(
            transformedData.map((d) => format(normalizeDate(d.date), "yyyy-MM-dd")) // Normalize before format
          );
          datesActuallyNeedingFetch.forEach((dateStr) => {
            if (!returnedDates.has(dateStr)) {
              const normalizedPlaceholderDate = normalizeDate(dateStr);
              if (isValidDate(normalizedPlaceholderDate)) {
                  console.log(`Page Adding placeholder for missing date: ${dateStr}`);
                  transformedData.push({ date: normalizedPlaceholderDate, meals: [] });
              } else {
                  console.warn(`Page Skipping placeholder for invalid date string: ${dateStr}`);
              }
            }
          });
        }

        // Merge data: Use a Map with normalized date strings as keys
        setWeekData((prevData) => {
          const dataMap = new Map<string, DayMeals>(
            prevData.map((day) => {
                const normalizedPrevDate = normalizeDate(day.date);
                return isValidDate(normalizedPrevDate)
                    ? [format(normalizedPrevDate, "yyyy-MM-dd"), day] as [string, DayMeals]
                    : ["invalid", day] as [string, DayMeals]; // Handle potential invalid dates in prevData
            }).filter(([key]) => key !== "invalid") // Filter out invalid entries
          );

          transformedData.forEach((day) => {
            const normalizedDayDate = normalizeDate(day.date); // Normalize once
            if (isValidDate(normalizedDayDate)) {
               const dateKey = format(normalizedDayDate, "yyyy-MM-dd");
               // Ensure the day object being set has the normalized date
               dataMap.set(dateKey, { ...day, date: normalizedDayDate });
            } else {
               console.warn("Page Skipping invalid date object during merge:", day);
            }
          });

          // Sort the final array by date
          return Array.from(dataMap.values()).sort(
            (a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime() // Normalize for sort
          );
        });
        setError(null); // Clear error on success

      } catch (error) {
        console.error("Page Error fetching or transforming meal data:", error);
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        // Only set error for actual failures, not expected "no history" cases handled above
        if (!errorMessage.includes("No meal history found") && !errorMessage.includes("500")) {
             setError(errorMessage);
        } else {
             setError(null); // Clear error if it was just a "no history" 500
        }

        // Add placeholders on error *only if data doesn't exist for those dates*
        setWeekData((prev) => {
          const dataMap = new Map<string, DayMeals>(
            prev.map((day) => {
                const normalizedPrevDate = normalizeDate(day.date);
                return isValidDate(normalizedPrevDate)
                    ? [format(normalizedPrevDate, "yyyy-MM-dd"), day] as [string, DayMeals]
                    : ["invalid", day] as [string, DayMeals];
            }).filter(([key]) => key !== "invalid")
          );

          datesActuallyNeedingFetch.forEach((dateStr) => {
            const normalizedDate = normalizeDate(dateStr);
            if (isValidDate(normalizedDate)) {
                const dateKey = format(normalizedDate, "yyyy-MM-dd");
                if (!dataMap.has(dateKey)) { // Only add if not already present
                    console.log(`Page Adding error placeholder for date: ${dateStr}`);
                    dataMap.set(dateKey, { date: normalizedDate, meals: [] });
                }
            } else {
                 console.warn(`Page Skipping error placeholder for invalid date string: ${dateStr}`);
            }
          });

          return Array.from(dataMap.values()).sort(
            (a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime()
          );
        });

      } finally {
        // Remove completed dates from fetching set
        datesActuallyNeedingFetch.forEach(date => fetchingDatesRef.current.delete(date));
        // Set loading false only if no other fetches are active
        if (fetchingDatesRef.current.size === 0) {
            setIsLoading(false);
            console.log("Page All fetches complete. isLoading set to false.");
        } else {
            console.log("Page Fetch complete for:", datesActuallyNeedingFetch.join(', '), "Remaining fetches:", Array.from(fetchingDatesRef.current));
        }
      }
    },
    [userId, isLoading]
  );

  // Callback for Viz to request fetching specific dates
  const handleFetchRequest = useCallback(
    (payload: FetchRequestPayload) => {
      const { datesToFetch } = payload;
      console.log("Page handleFetchRequest received from Viz. Dates:", datesToFetch.join(', ') || 'None');
      if (datesToFetch.length > 0) {
        fetchMealData(datesToFetch);
      }
    },
    [fetchMealData]
  );

  // Callback for Viz to signal a date change
  const handleDateSelect = useCallback((newDate: Date) => {
      const normalizedNewDate = normalizeDate(newDate);
      // Use isSameDay for comparison after normalization
      if (!isSameDay(selectedDate, normalizedNewDate)) {
          console.log("Page Updating selectedDate state to:", format(normalizedNewDate, "yyyy-MM-dd"));
          setSelectedDate(normalizedNewDate);
          // Fetching is triggered by the Viz's useEffect based on the new selectedDate prop
      } else {
          console.log("Page Date selected is the same as current. No state update.");
      }
  }, [selectedDate]);

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
      console.log("Page Initial load effect waiting for userId.");
      // Optionally set loading false if userId is missing and won't appear?
      // Or show a "Login required" message. For now, just waits.
  }
}, [userId, selectedDate, fetchMealData]);

  // Render Logic

  // Show initial loading screen (before first fetch attempt)
  if (isLoading && !initialLoadAttemptedRef.current) {
    return (
      <MainLayout title="Meal Calendar" subtitle="Loading your meal data...">
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </MainLayout>
    );
  }

  // Show error screen
  if (error) {
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
                fetchMealData(datesToFetch);
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
      mealPlan = JSON.parse(localStorage.getItem("mealPlan") || "{}");
  } catch (e) {
      console.error("Failed to parse mealPlan from localStorage:", e);
      // Handle error, maybe clear localStorage or use default empty object
      localStorage.removeItem("mealPlan"); // Example: clear invalid data
  }


  return (
    <MainLayout
      title="Meal Calendar"
      subtitle="Plan and Track Your Meals With Ease"
    >
      <MealCalendarViz
        mealData={weekData} // This is the source of truth from the parent
        userPreferences={userPreferences}
        nutritionalGoals={nutritionalGoals}
        mealPlan={mealPlan}
        onRequestFetch={handleFetchRequest}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />
      {/* Overlay loading indicator - show only when actively fetching */}
      {isLoading && initialLoadAttemptedRef.current && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </MainLayout>
  );
};

export default MealTimelinePage;

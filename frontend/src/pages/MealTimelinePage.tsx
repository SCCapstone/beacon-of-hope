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
import { subDays, addDays, format, isSameDay, parseISO } from "date-fns";
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

const normalizeDate = (date: Date | string): Date => {
  // Handle both Date objects and string representations
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    console.warn("normalizeDate received invalid input, returning current date:", date);
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
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
      // Filter out dates that are *already* being fetched
      const datesActuallyNeedingFetch = datesToFetchParam.filter(
        (dateStr) => !fetchingDatesRef.current.has(dateStr)
      );

      if (datesActuallyNeedingFetch.length === 0) {
        console.log("Fetch skipped: Dates already being fetched or empty list.", datesToFetchParam);
        // If the overall loading state is true but nothing needs fetching now, turn it off.
        if (isLoading && fetchingDatesRef.current.size === 0) {
             // If we thought we were loading but nothing is actually fetching, stop loading.
             // This can happen if a check runs after data arrived but before state fully settled.
             setIsLoading(false);
        }
        return;
      }

      // Add newly requested dates to the fetching set
      datesActuallyNeedingFetch.forEach(date => fetchingDatesRef.current.add(date));

      console.log("Fetching meal data for dates:", datesActuallyNeedingFetch);
      // Ensure loading is true when starting a fetch
      if (!isLoading) setIsLoading(true);
      // Don't reset error here, let the success path reset it if needed
      // setError(null);
      initialLoadAttemptedRef.current = true;

      try {
        const response = await fetchMealDays(userId, datesActuallyNeedingFetch);
        console.log("API response received for:", datesActuallyNeedingFetch.join(', '));

        let transformedData: DayMeals[] = [];
        if (
          !response.day_plans ||
          Object.keys(response.day_plans).length === 0
        ) {
          console.log("No meal history found for the requested dates:", datesActuallyNeedingFetch.join(', '));
          // Create placeholders ONLY for the dates requested in *this* fetch
          transformedData = datesActuallyNeedingFetch.map((dateStr) => ({
            date: normalizeDate(dateStr), // Use normalizeDate here
            meals: [],
          }));
        } else {
          transformedData = await transformApiResponseToDayMeals(response);
          console.log("Data transformed:", transformedData.length, "days");
          // Ensure placeholders are added for any requested dates *not* in the response
          const returnedDates = new Set(
            transformedData.map((d) =>
              format(normalizeDate(d.date), "yyyy-MM-dd") // Normalize before format
            )
          );
          datesActuallyNeedingFetch.forEach((dateStr) => {
            if (!returnedDates.has(dateStr)) {
              console.log(`Adding placeholder for missing date: ${dateStr}`);
              transformedData.push({
                date: normalizeDate(dateStr), // Use normalizeDate
                meals: [],
              });
            }
          });
        }

        // Merge data
        setWeekData((prevData) => {
          const dataMap = new Map(
            prevData.map((day) => [
              format(normalizeDate(day.date), "yyyy-MM-dd"), // Normalize before format
              day,
            ])
          );
          transformedData.forEach((day) => {
            const normalizedDayDate = normalizeDate(day.date); // Normalize once
            if (normalizedDayDate instanceof Date && !isNaN(normalizedDayDate.getTime())) {
               dataMap.set(
                 format(normalizedDayDate, "yyyy-MM-dd"),
                 day
               );
            } else {
               console.warn("Skipping invalid date object during merge:", day);
            }
          });
          // Sort the final array by date
          return Array.from(dataMap.values()).sort(
            (a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime() // Normalize for sort
          );
        });
        // Clear error on successful fetch and transform
        setError(null);

      } catch (error) {
        console.error("Error fetching or transforming meal data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        // Avoid setting error if it's just a 500 for no history, which is handled above
        if (!errorMessage.includes("No meal history found")) {
            setError(errorMessage);
        }

        // Add placeholders on error *only if data doesn't exist*
        const errorPlaceholders: DayMeals[] = datesActuallyNeedingFetch.map((dateStr) => ({
          date: normalizeDate(dateStr), // Use normalizeDate
          meals: [],
        }));

        // Merge placeholders, ensuring not to overwrite existing data if retry happens
        setWeekData((prev) => {
          const dataMap = new Map(
            prev.map((day) => [
              format(normalizeDate(day.date), "yyyy-MM-dd"), // Normalize
              day,
            ])
          );
          errorPlaceholders.forEach((day) => {
            const dateStr = format(normalizeDate(day.date), "yyyy-MM-dd"); // Normalize
            if (!dataMap.has(dateStr)) {
              dataMap.set(dateStr, day);
            }
          });
          return Array.from(dataMap.values()).sort(
            (a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime() // Normalize
          );
        });
      } finally {
        // Remove the completed dates from the fetching set
        datesActuallyNeedingFetch.forEach(date => fetchingDatesRef.current.delete(date));
        // Only set loading to false if *no other* fetches are in progress
        if (fetchingDatesRef.current.size === 0) {
            setIsLoading(false);
            console.log("All fetches complete. isLoading set to false.");
        } else {
            console.log("Fetch complete for:", datesActuallyNeedingFetch.join(', '), "Remaining fetches:", Array.from(fetchingDatesRef.current));
        }
      }
    },
    [userId, isLoading] // Keep isLoading dependency here
  );

  // Callback for Viz to request fetching specific dates
  const handleFetchRequest = useCallback(
    (payload: FetchRequestPayload) => {
      const { datesToFetch } = payload;
      console.log(
        "MealTimelinePage: handleFetchRequest called by Viz. Dates requested:",
        datesToFetch.length > 0 ? datesToFetch.join(', ') : 'None'
      );

      if (datesToFetch.length > 0) {
        fetchMealData(datesToFetch);
      } else {
        console.log("MealTimelinePage: No dates to fetch in this request.");
      }
    },
    [fetchMealData] // Only depends on fetchMealData
  );

  // Callback for Viz to signal a date change
  const handleDateSelect = useCallback((newDate: Date) => {
      const normalizedNewDate = normalizeDate(newDate);
      // Check if the date actually changed before updating state
      if (!isSameDay(selectedDate, normalizedNewDate)) {
          console.log(
              "MealTimelinePage: Updating selectedDate state to:",
              format(normalizedNewDate, "yyyy-MM-dd")
          );
          setSelectedDate(normalizedNewDate);
          // No fetch call here - the Viz's effect will handle it after re-render
      }
  }, [selectedDate]); // Depends on current selectedDate

  // Initial data load effect (runs once)
  useEffect(() => {
    if (!initialLoadAttemptedRef.current && userId) { // Ensure userId is available
      console.log("MealTimelinePage: Initial load effect running.");
      // Use the initial selectedDate state
      const initialStart = subDays(selectedDate, 3);
      const initialEnd = addDays(selectedDate, 3);
      const initialDatesToFetch = generateDateRange(initialStart, initialEnd);
      fetchMealData(initialDatesToFetch);
    }
  }, [userId]); // Run when userId becomes available

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

  // Render main content
  const mealPlan = JSON.parse(localStorage.getItem("mealPlan") || "{}");

  return (
    <MainLayout
      title="Meal Calendar"
      subtitle="Plan and Track Your Meals With Ease"
    >
      <MealCalendarViz
        mealData={weekData}
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

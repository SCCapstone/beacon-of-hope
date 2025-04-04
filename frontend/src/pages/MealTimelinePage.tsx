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
import { subDays, addDays, format, isSameDay } from "date-fns";

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

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Type for the callback payload from Viz
type FetchRequestPayload = {
  datesToFetch: string[]; // Only the dates that need fetching
  newSelectedDate?: Date; // The date that triggered the request
};

export const MealTimelinePage: React.FC = () => {
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    normalizeDate(new Date())
  );

  // Ref to track if a fetch is currently in progress to prevent concurrent fetches
  const isFetchingRef = useRef(false);
  const initialLoadAttemptedRef = useRef(false); // Track if initial fetch has been tried

  const userId = JSON.parse(localStorage.user)._id || "";
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
    async (datesToFetch: string[]) => {
      if (isFetchingRef.current) {
        console.log("Fetch already in progress, skipping.");
        return;
      }
      // Only set loading true if we actually need to fetch
      if (datesToFetch.length === 0) {
        console.log("No dates need fetching.");
        // If loading was true, set it false. Avoids flicker if called unnecessarily.
        if (isLoading) setIsLoading(false);
        return;
      }

      console.log("Fetching meal data for dates:", datesToFetch);
      isFetchingRef.current = true;
      setIsLoading(true); // Now we are sure we need to load
      setError(null);
      initialLoadAttemptedRef.current = true; // Mark that a fetch attempt has started

      try {
        const response = await fetchMealDays(userId, datesToFetch);
        console.log("API response received");

        let transformedData: DayMeals[] = [];
        if (
          !response.day_plans ||
          Object.keys(response.day_plans).length === 0
        ) {
          console.log("No meal history found for the requested dates");
          // Create placeholders for dates that returned no data
          transformedData = datesToFetch.map((dateStr) => ({
            date: normalizeDate(new Date(dateStr)),
            meals: [],
          }));
        } else {
          transformedData = await transformApiResponseToDayMeals(response);
          console.log("Data transformed:", transformedData.length, "days");
          // Ensure placeholders are added for any requested dates *not* in the response
          const returnedDates = new Set(
            transformedData.map((d) =>
              format(normalizeDate(new Date(d.date)), "yyyy-MM-dd")
            )
          );
          datesToFetch.forEach((dateStr) => {
            if (!returnedDates.has(dateStr)) {
              console.log(`Adding placeholder for missing date: ${dateStr}`);
              transformedData.push({
                date: normalizeDate(new Date(dateStr)),
                meals: [],
              });
            }
          });
        }

        // Update state by merging new/updated data with existing data
        setWeekData((prevData) => {
          const dataMap = new Map(
            prevData.map((day) => [
              format(normalizeDate(new Date(day.date)), "yyyy-MM-dd"),
              day,
            ])
          );
          transformedData.forEach((day) => {
            dataMap.set(
              format(normalizeDate(new Date(day.date)), "yyyy-MM-dd"),
              day
            );
          });
          // Sort the final array by date
          return Array.from(dataMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        });
      } catch (error) {
        console.error("Error fetching meal data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setError(errorMessage);

        // Add empty placeholders for the dates that were *attempted* but failed
        const errorPlaceholders: DayMeals[] = datesToFetch.map((dateStr) => ({
          date: normalizeDate(new Date(dateStr)),
          meals: [],
        }));

        // Merge placeholders, ensuring not to overwrite existing data if retry happens
        setWeekData((prev) => {
          const dataMap = new Map(
            prev.map((day) => [
              format(normalizeDate(new Date(day.date)), "yyyy-MM-dd"),
              day,
            ])
          );
          errorPlaceholders.forEach((day) => {
            const dateStr = format(
              normalizeDate(new Date(day.date)),
              "yyyy-MM-dd"
            );
            // Only add placeholder if data for this date doesn't already exist
            if (!dataMap.has(dateStr)) {
              dataMap.set(dateStr, day);
            }
          });
          return Array.from(dataMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        });
      } finally {
        setIsLoading(false); // Always set loading false when fetch attempt ends
        isFetchingRef.current = false;
      }
    },
    [userId]
  );

  // Callback triggered by the Visualization component - Now stable and simpler
  const handleFetchRequest = useCallback(
    (payload: FetchRequestPayload) => {
      const { datesToFetch, newSelectedDate } = payload;

      console.log(
        "MealTimelinePage: handleFetchRequest called by Viz. Need to fetch:",
        datesToFetch.length,
        newSelectedDate
          ? `Selected: ${format(newSelectedDate, "yyyy-MM-dd")}`
          : ""
      );

      // Update selectedDate state *first* if provided and different
      if (newSelectedDate && !isSameDay(selectedDate, newSelectedDate)) {
        console.log(
          "MealTimelinePage: Updating selectedDate state to:",
          format(newSelectedDate, "yyyy-MM-dd")
        );
        setSelectedDate(newSelectedDate);
      }

      // Call fetchMealData - it will handle the isLoading state internally
      // Only call if there are actually dates to fetch
      if (datesToFetch.length > 0) {
        fetchMealData(datesToFetch);
      } else {
        console.log("MealTimelinePage: No dates to fetch in this request.");
      }
    },
    [fetchMealData, selectedDate]
  );

  // Initial data load effect
  useEffect(() => {
    // Only run initial fetch once
    if (!initialLoadAttemptedRef.current && !isFetchingRef.current) {
      console.log("MealTimelinePage: Initial load effect running.");
      const today = normalizeDate(new Date());
      // Fetch a range around the initial date (e.g., 7 days for Meal view)
      const initialStart = subDays(today, 3);
      const initialEnd = addDays(today, 3);
      const initialDatesToFetch = generateDateRange(initialStart, initialEnd);
      fetchMealData(initialDatesToFetch); // Trigger the first fetch
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMealData]); // Depend only on stable fetchMealData

  // --- Render Logic ---

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
                fetchMealData(datesToFetch); // Properly pass the date array
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
      {/* Pass the stable handleFetchRequest */}
      <MealCalendarViz
        mealData={weekData}
        userPreferences={userPreferences}
        nutritionalGoals={nutritionalGoals}
        mealPlan={mealPlan}
        onRequestFetch={handleFetchRequest}
        initialSelectedDate={selectedDate}
      />
      {/* Overlay loading indicator - show only when actively fetching */}
      {/* Ensure it shows only after the initial attempt to avoid flicker */}
      {isLoading && initialLoadAttemptedRef.current && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </MainLayout>
  );
};

export default MealTimelinePage;

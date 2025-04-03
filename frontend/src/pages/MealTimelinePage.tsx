import React, { useState, useEffect, useCallback } from "react";
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

export const MealTimelinePage: React.FC = () => {
  // Use weekData state here as the single source of truth for loaded meal data
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    normalizeDate(new Date())
  ); // Normalize initial date

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

  // Check which dates we already have data for using the weekData state
  const existingDates = new Set(
    weekData.map((day) =>
      format(normalizeDate(new Date(day.date)), "yyyy-MM-dd")
    )
  );

  // Function to fetch meal data for a date range
  const fetchMealData = useCallback(
    async (startDate: Date, endDate: Date) => {
      // Normalize input dates
      const normStart = normalizeDate(startDate);
      const normEnd = normalizeDate(endDate);

      try {
        console.log(
          "Fetching meal data for:",
          format(normStart, "yyyy-MM-dd"),
          "to",
          format(normEnd, "yyyy-MM-dd")
        );

        // Generate array of dates to fetch
        const allDates = generateDateRange(normStart, normEnd);

        // Filter to only fetch dates we don't already have
        const datesToFetch = allDates.filter(
          (dateStr) => !existingDates.has(dateStr)
        );

        // If we already have all the data, no need to fetch
        if (datesToFetch.length === 0) {
          console.log("All dates already loaded, skipping API call");
          // Ensure loading is false if we skip
          if (isLoading) setIsLoading(false);
          return;
        }

        console.log("Dates to fetch:", datesToFetch);
        setIsLoading(true); // Set loading true only if we are fetching

        const userId = JSON.parse(localStorage.user)._id || "";

        // Fetch meal data from API only for dates we need
        const response = await fetchMealDays(userId, datesToFetch);
        console.log("API response received");

        let transformedData: DayMeals[] = [];
        // Check if we got empty data (no meal history)
        if (
          !response.day_plans ||
          Object.keys(response.day_plans).length === 0
        ) {
          console.log("No meal history found for the requested dates");
          // Create empty placeholder data for the fetched dates
          transformedData = datesToFetch.map((dateStr) => ({
            date: normalizeDate(new Date(dateStr)), // Ensure date is normalized
            meals: [],
          }));
        } else {
          // Transform API response to DayMeals format
          transformedData = await transformApiResponseToDayMeals(response);
          console.log("Data transformed:", transformedData.length, "days");
        }

        // Update the week data state by merging previous and new data
        setWeekData((prevData) => {
          // Create a map of existing data for easy lookup and update
          const dataMap = new Map(
            prevData.map((day) => [
              format(normalizeDate(new Date(day.date)), "yyyy-MM-dd"),
              day,
            ])
          );

          // Add or update with new data (including empty placeholders)
          transformedData.forEach((day) => {
            const dateKey = format(
              normalizeDate(new Date(day.date)),
              "yyyy-MM-dd"
            );
            dataMap.set(dateKey, day);
          });

          // Convert back to array and sort by date
          return Array.from(dataMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        });

        setError(null);
      } catch (error) {
        console.error("Error fetching meal data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while loading data"
        );

        // Optionally add empty placeholders for failed dates to prevent UI breaks
        // This logic might need refinement based on desired error handling
        const errorPlaceholders: DayMeals[] = generateDateRange(
          normStart,
          normEnd
        )
          .filter((dateStr) => !existingDates.has(dateStr)) // Only for dates that failed
          .map((dateStr) => ({
            date: normalizeDate(new Date(dateStr)),
            meals: [],
          }));

        setWeekData((prev) => {
          const dataMap = new Map(
            prev.map((day) => [
              format(normalizeDate(new Date(day.date)), "yyyy-MM-dd"),
              day,
            ])
          );
          errorPlaceholders.forEach((day) => {
            const dateKey = format(
              normalizeDate(new Date(day.date)),
              "yyyy-MM-dd"
            );
            if (!dataMap.has(dateKey)) {
              // Avoid overwriting potentially loaded data
              dataMap.set(dateKey, day);
            }
          });
          return Array.from(dataMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        });
      } finally {
        setIsLoading(false); // Ensure loading is set to false after fetch attempt
      }
    },
    [weekData, isLoading, userId] // Include isLoading and userId
  );

  const handleDateRangeChange = useCallback(
    (start: Date, end: Date, newSelectedDate?: Date) => {
      const normStart = normalizeDate(start);
      const normEnd = normalizeDate(end);
      const normSelected = newSelectedDate
        ? normalizeDate(newSelectedDate)
        : undefined;

      console.log(
        "MealTimelinePage: Date range change triggered by Viz:",
        format(normStart, "yyyy-MM-dd"),
        "to",
        format(normEnd, "yyyy-MM-dd"),
        normSelected ? `Selected: ${format(normSelected, "yyyy-MM-dd")}` : ""
      );

      // Update the selected date state if provided and different
      if (normSelected && !isSameDay(selectedDate, normSelected)) {
        console.log("MealTimelinePage: Updating selectedDate state");
        setSelectedDate(normSelected);
      }

      // Trigger fetch for the requested range. fetchMealData handles checking existing dates.
      console.log("MealTimelinePage: Calling fetchMealData");
      fetchMealData(normStart, normEnd);
    },
    [fetchMealData, selectedDate] // Keep selectedDate dependency here
  );

  // Initial data load - fetch for the default view (e.g., Meal view = 7 days)
  useEffect(() => {
    const today = normalizeDate(new Date());
    // Fetch initial range based on default view (assuming 'meal')
    const initialStart = subDays(today, 3);
    const initialEnd = addDays(today, 3);
    console.log("MealTimelinePage: Initial fetch");
    // Set selected date first, then trigger range change/fetch
    // No need to set selectedDate here again as it's initialized in useState
    handleDateRangeChange(initialStart, initialEnd, today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // This effect handles the initial loading state more accurately
  useEffect(() => {
    if (weekData.length === 0 && error === null) {
      setIsLoading(true);
    } else {
      // Set loading false if we have data or an error
      setIsLoading(false);
    }
  }, [weekData, error]);

  // Render loading indicator based on isLoading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <div className="text-center">
          <p className="text-xl mb-4">Error Loading Data</p>
          <p>{error}</p>
          {/* Optionally add a retry button */}
        </div>
      </div>
    );
  }

  const mealPlan = JSON.parse(localStorage.getItem("mealPlan") || "{}");
  return (
    <MainLayout
      title="Meal Calendar"
      subtitle="Plan and Track Your Meals With Ease"
    >
      {/* Pass weekData state directly as mealData prop */}
      <MealCalendarViz
        mealData={weekData}
        userPreferences={userPreferences}
        nutritionalGoals={nutritionalGoals}
        mealPlan={mealPlan}
        onDateRangeChange={handleDateRangeChange}
        initialSelectedDate={selectedDate} // Pass the selectedDate state
      />
    </MainLayout>
  );
};

export default MealTimelinePage;

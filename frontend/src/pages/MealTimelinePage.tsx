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
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
  const [pendingFetch, setPendingFetch] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 1),
    end: addDays(new Date(), 1),
  });
  const [loadedDateRanges, setLoadedDateRanges] = useState<
    Array<{ start: Date; end: Date }>
  >([]);

  // Function to fetch meal data for a date range
  const fetchMealData = useCallback(
    async (startDate: Date, endDate: Date) => {
      try {
        console.log(
          "Fetching meal data for:",
          format(startDate, "yyyy-MM-dd"),
          "to",
          format(endDate, "yyyy-MM-dd")
        );

        // Check which dates we already have data for
        const existingDates = new Set(
          weekData.map((day) => format(new Date(day.date), "yyyy-MM-dd"))
        );

        // Generate array of dates to fetch
        const allDates = generateDateRange(startDate, endDate);

        // Filter to only fetch dates we don't already have
        const datesToFetch = allDates.filter(
          (dateStr) => !existingDates.has(dateStr)
        );

        // If we already have all the data, no need to fetch
        if (datesToFetch.length === 0) {
          console.log("All dates already loaded, skipping API call");
          setPendingFetch(false);
          return;
        }

        console.log("Dates to fetch:", datesToFetch);
        setIsLoading(true);

        const userId = JSON.parse(localStorage.user)._id || "";

        // Fetch meal data from API only for dates we need
        const response = await fetchMealDays(userId, datesToFetch);
        console.log("API response received");

        // Check if we got empty data (no meal history)
        if (
          !response.day_plans ||
          Object.keys(response.day_plans).length === 0
        ) {
          console.log("No meal history found for the requested dates");
          // Create empty placeholder data for the requested dates
          const emptyData: DayMeals[] = datesToFetch.map((dateStr) => ({
            date: new Date(dateStr),
            meals: [],
          }));

          setWeekData((prev) => [...prev, ...emptyData]);
          setIsLoading(false);
          setPendingFetch(false);
          return;
        }

        // Transform API response to DayMeals format
        const transformedData = await transformApiResponseToDayMeals(response);
        console.log("Data transformed:", transformedData.length, "days");

        // Update the week data with the new data
        setWeekData((prevData) => {
          // Create a map of existing data for easy lookup
          const dataMap = new Map(
            prevData.map((day) => [
              format(new Date(day.date), "yyyy-MM-dd"),
              day,
            ])
          );

          // Add or update with new data
          transformedData.forEach((day) => {
            const dateKey = format(new Date(day.date), "yyyy-MM-dd");
            dataMap.set(dateKey, day);
          });

          // Convert back to array and sort by date
          return Array.from(dataMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        });

        // Update loaded date ranges
        setLoadedDateRanges((prev) => [
          ...prev,
          { start: startDate, end: endDate },
        ]);

        setError(null);
      } catch (error) {
        console.error("Error fetching meal data:", error);
        // For critical errors, still show the error
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while loading data"
        );

        // But also provide empty data for the requested dates so the UI doesn't break
        const emptyData: DayMeals[] = generateDateRange(startDate, endDate).map(
          (dateStr) => ({
            date: new Date(dateStr),
            meals: [],
          })
        );

        setWeekData((prev) => {
          const dataMap = new Map(
            prev.map((day) => [format(new Date(day.date), "yyyy-MM-dd"), day])
          );

          emptyData.forEach((day) => {
            const dateKey = format(new Date(day.date), "yyyy-MM-dd");
            if (!dataMap.has(dateKey)) {
              dataMap.set(dateKey, day);
            }
          });

          return Array.from(dataMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        });
      } finally {
        setIsLoading(false);
        setPendingFetch(false);
      }
    },
    [weekData]
  ); // Add dependencies for fetchMealData

  const handleDateRangeChange = useCallback(
    (start: Date, end: Date, newSelectedDate?: Date) => {
      console.log(
        "MealTimelinePage: Date range change triggered by Viz:",
        format(start, "yyyy-MM-dd"),
        "to",
        format(end, "yyyy-MM-dd"),
        newSelectedDate
          ? `Selected: ${format(newSelectedDate, "yyyy-MM-dd")}`
          : ""
      );

      // Update the selected date if provided by the Viz component
      if (newSelectedDate) {
        // Check if the date actually changed to avoid redundant state updates
        if (!selectedDate || !isSameDay(selectedDate, newSelectedDate)) {
          console.log("MealTimelinePage: Updating selectedDate state");
          setSelectedDate(new Date(newSelectedDate)); // Use new Date() to ensure it's a new object if needed
        }
      }

      // Update the date range state used for fetching/cleanup
      setDateRange({ start, end });

      // Fetch data for the requested range (fetchMealData already checks for existing dates)
      // No need to check needsFetch here, let fetchMealData handle it.
      console.log("MealTimelinePage: Calling fetchMealData");
      fetchMealData(start, end);
    },
    [fetchMealData, selectedDate] // Add selectedDate dependency if using it in the check
    // Note: fetchMealData needs to be stable or wrapped in useCallback if defined inside the component
  );

  // Initial data load - fetch for the default view (e.g., Meal view = 7 days)
  useEffect(() => {
    const today = normalizeDate(new Date());
    // Fetch initial range based on default view (assuming 'meal')
    const initialStart = subDays(today, 3);
    const initialEnd = addDays(today, 3);
    console.log("MealTimelinePage: Initial fetch");
    // Set selected date first, then trigger range change/fetch
    setSelectedDate(today);
    handleDateRangeChange(initialStart, initialEnd, today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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
      <MealCalendarViz
        initialData={weekData}
        userPreferences={userPreferences}
        nutritionalGoals={nutritionalGoals}
        mealPlan={mealPlan}
        onDateRangeChange={handleDateRangeChange}
        initialSelectedDate={selectedDate}
      />
    </MainLayout>
  );
};

export default MealTimelinePage;

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
import { subDays, addDays, format } from "date-fns";

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
  const fetchMealData = async (startDate: Date, endDate: Date) => {
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

      // Transform API response to DayMeals format
      const transformedData = await transformApiResponseToDayMeals(response);
      console.log("Data transformed:", transformedData.length, "days");

      // Update the week data with the new data
      setWeekData((prevData) => {
        // Create a map of existing data for easy lookup
        const dataMap = new Map(
          prevData.map((day) => [format(new Date(day.date), "yyyy-MM-dd"), day])
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
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while loading data"
      );
    } finally {
      setIsLoading(false);
      setPendingFetch(false);
    }
  };

  const handleDateRangeChange = useCallback(
    (start: Date, end: Date, newSelectedDate?: Date) => {
      console.log(
        "Date range change handler called:",
        format(start, "yyyy-MM-dd"),
        "to",
        format(end, "yyyy-MM-dd"),
        newSelectedDate
          ? `with selected date: ${format(newSelectedDate, "yyyy-MM-dd")}`
          : ""
      );

      // Update the selected date if provided
      if (newSelectedDate) {
        setSelectedDate(newSelectedDate);
      }

      setDateRange({ start, end });

      // Only fetch if we don't already have the data
      const needsFetch = [start, end].some((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return !weekData.some(
          (day) => format(new Date(day.date), "yyyy-MM-dd") === dateStr
        );
      });

      if (needsFetch) {
        fetchMealData(start, end);
      } else {
        console.log("All dates already loaded, skipping fetch");
      }
    },
    [weekData]
  );

  useEffect(() => {
    // Clean up old data that's no longer needed
    setWeekData((prevData) => {
      const retentionDays = 7; // Keep data for 7 days around the current date
      const oldestToKeep = subDays(dateRange.start, retentionDays);
      const newestToKeep = addDays(dateRange.end, retentionDays);

      return prevData.filter((day) => {
        const dayDate = new Date(day.date);
        return dayDate >= oldestToKeep && dayDate <= newestToKeep;
      });
    });
  }, [dateRange]);

  // Initial data load
  useEffect(() => {
    const today = new Date();
    const initialStart = subDays(today, 1);
    const initialEnd = addDays(today, 1);
    handleDateRangeChange(initialStart, initialEnd);
  }, []);

  // Effect to fetch data when date range changes
  useEffect(() => {
    console.log(dateRange);
    fetchMealData(dateRange.start, dateRange.end);
  }, [dateRange]);

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

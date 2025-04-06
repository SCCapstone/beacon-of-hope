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
} from "../services/recipeService";
import { subDays, addDays, format, isSameDay, parseISO, isValid as isValidDate } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";


const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
      console.warn("MealTimeLinePage normalizeDate received null/undefined, returning current date.");
      const fallbackDate = new Date();
      fallbackDate.setHours(0, 0, 0, 0);
      return fallbackDate;
  }
  // Handle string parsing carefully, assuming 'yyyy-MM-dd' or ISO format
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
      console.warn("MealTimeLinePage normalizeDate received invalid date, returning current date:", date);
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
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [isLoadingGoals, setIsLoadingGoals] = useState(true); // Specific loading for goals
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(normalizeDate(new Date()));
  const [nutritionalGoals, setNutritionalGoals] = useState<NutritionalGoals | null>(null); // State for goals

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
            console.error("MealTimelinePage: Error fetching nutritional goals:", err);
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
        // Check if day_plans is an object and not empty
        if (response.day_plans && typeof response.day_plans === 'object' && Object.keys(response.day_plans).length > 0) {
            transformedData = await transformApiResponseToDayMeals(response);
            // console.log("Page Data transformed:", transformedData.length, "days");
        } else {
            console.log("Page No meal history found in response for requested dates:", datesActuallyNeedingFetch.join(', '));
        }

        // Ensure placeholders are added for any requested dates *not* in the response
        // and not already added via transformation (if transformation handles empty days)
        const returnedDates = new Set(
            transformedData.map((d) => format(normalizeDate(d.date), "yyyy-MM-dd"))
        );
        datesActuallyNeedingFetch.forEach((dateStr) => {
            if (!returnedDates.has(dateStr)) {
                const normalizedPlaceholderDate = normalizeDate(dateStr);
                if (isValidDate(normalizedPlaceholderDate)) {
                    // console.log(`Page Adding placeholder for missing date: ${dateStr}`);
                    transformedData.push({ date: normalizedPlaceholderDate, meals: [] });
                } else {
                    console.warn(`Page Skipping placeholder for invalid date string: ${dateStr}`);
                }
            }
        });

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

      } catch (error: any) {
        console.error("Page Error fetching or transforming meal data:", error);
        setError(error.message || "Failed to load meal history.");

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
                if (!dataMap.has(dateKey)) {
                    // console.log(`Page Adding error placeholder for date: ${dateStr}`);
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
        datesActuallyNeedingFetch.forEach(date => fetchingDatesRef.current.delete(date));
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
  const handleDateSelect = useCallback((newDate: Date) => {
      const normalizedNewDate = normalizeDate(newDate);
      // Use isSameDay for comparison after normalization
      if (!isSameDay(selectedDate, normalizedNewDate)) {
          // console.log("Page Updating selectedDate state to:", format(normalizedNewDate, "yyyy-MM-dd"));
          setSelectedDate(normalizedNewDate);
      }
      // else {
          // console.log("Page Date selected is the same as current. No state update.");
      // }
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
      // console.log("Page Initial load effect waiting for userId.");
      setIsLoading(false); // Stop loading if no user ID
      setWeekData([]); // Clear any existing data
      setError("Please log in to view your meal plan."); // Set error message
    }
  }, [userId, selectedDate, fetchMealData]);

  // Render Logic

  // Combined loading state check
  const showLoadingScreen = (isLoading || isLoadingGoals) && !initialLoadAttemptedRef.current;
  const showOverlayLoader = (isLoading || isLoadingGoals) && initialLoadAttemptedRef.current;

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
  if (error && !userId) { // Show login error prominently
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
  } else if (error) { // Show other errors
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
          if (typeof mealPlan !== 'object' || mealPlan === null || !('days' in mealPlan) || typeof (mealPlan as any).days !== 'object') {
              console.warn("Invalid mealPlan structure in localStorage. Resetting.", mealPlan);
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
      carbohydrates: { daily: 250, unit: 'g' },
      protein: { daily: 100, unit: 'g' },
      fiber: { daily: 30, unit: 'g' },
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
      />
      {/* Overlay loading indicator */}
      {showOverlayLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </MainLayout>
  );
};

export default MealTimelinePage;

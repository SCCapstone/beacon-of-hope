import { useState, useEffect } from "react";
import { DayMeals } from "../components/MealTimeline/types";
import {
  fetchMealDays,
  generateDateRange,
  transformApiResponseToDayMeals,
} from "../services/recipeService";
import { handleApiError } from "../utils/errorHandling";

export function useMealData(userId: string, initialDate: Date) {
  const [data, setData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (startDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const dates = generateDateRange(startDate, endDate);

      const response = await fetchMealDays(userId, dates);
      const transformedData = await transformApiResponseToDayMeals(
        response,
      );

      setData(transformedData);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(initialDate);
  }, [userId, initialDate]);

  return {
    data,
    isLoading,
    error,
    refreshData: loadData,
  };
}

import { useState, useEffect } from "react";
import { DayMeals, FilterOptions } from "../types";
import { filterData } from "../utils/filterUtils";
import { startOfWeek, endOfWeek, startOfDay, isSameDay, addDays } from "date-fns";

export const useVisualizationData = (
  initialData: DayMeals[],
  filters: FilterOptions,
  selectedDate: Date
) => {
  const [data, setData] = useState<DayMeals[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);

        // Ensure all dates are Date objects
        const processedData = initialData.map(day => ({
          ...day,
          date: new Date(day.date)
        }));

        // Get week boundaries
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

        // Create array of dates for the week
        const weekDates = Array.from({ length: 7 }).map((_, index) => {
          const date = addDays(weekStart, index);
          return startOfDay(date);
        });

        // Map data to correct days, ensuring dates are properly compared
        const weekData = weekDates.map((date) => {
          const dayData = initialData.find((day) =>
            isSameDay(new Date(day.date), date)
          );

          return {
            date: date,
            meals: dayData?.meals || [],
          };
        });

        const filteredData = await filterData(processedData, filters);
        setData(filteredData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error processing data");
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [initialData, filters, selectedDate]);

  return { data, loading, error };
};

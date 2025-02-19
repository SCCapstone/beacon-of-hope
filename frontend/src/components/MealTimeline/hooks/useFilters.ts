import { useState, useCallback } from "react";
import { FilterOptions } from "../types";

const defaultFilters: FilterOptions = {
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  mealTypes: [],
  foodTypes: [],
  ingredients: [],
  nutritionalRange: {
    calories: { min: 0, max: 1000 },
    carbs: { min: 0, max: 100 },
    protein: { min: 0, max: 50 },
    fat: { min: 0, max: 50 },
  },
  healthFilters: {
    diabetesFriendly: false,
    culturalPreference: [],
    allergenFree: [],
  },
};

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
};

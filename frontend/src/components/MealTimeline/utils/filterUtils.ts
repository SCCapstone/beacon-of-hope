import { DayMeals, FilterOptions } from "../types";

export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const filterData = async (
  data: DayMeals[],
  filters: FilterOptions
): Promise<DayMeals[]> => {
  return data
    .filter((day) => {
      // Normalize dates for comparison
      const dayDate = normalizeDate(new Date(day.date));
      const startDate = normalizeDate(filters.dateRange.start);
      const endDate = normalizeDate(filters.dateRange.end);

      // Date range filter
      if (dayDate < startDate || dayDate > endDate) {
        return false;
      }

      // Filter meals
      const filteredMeals = day.meals.filter((meal) => {
        // Meal type filter
        if (
          filters.mealTypes.length > 0 &&
          !filters.mealTypes.includes(meal.type)
        ) {
          return false;
        }

        // Food type filter
        if (filters.foodTypes.length > 0) {
          const hasMatchingFood = meal.foods.some((food) =>
            filters.foodTypes.includes(food.type)
          );
          if (!hasMatchingFood) return false;
        }

        // Ingredient filter
        if (filters.ingredients.length > 0) {
          const hasMatchingIngredient = meal.foods.some((food) =>
            food.ingredients.some((ing) =>
              filters.ingredients.includes(ing.name)
            )
          );
          if (!hasMatchingIngredient) return false;
        }

        // Nutritional range filter
        const meetsNutritionalCriteria = Object.entries(
          filters.nutritionalRange
        ).every(([nutrient, range]) => {
          const value =
            meal.nutritionalInfo[nutrient as keyof typeof meal.nutritionalInfo];
          return value !== undefined && value >= range.min && value <= range.max;
        });
        if (!meetsNutritionalCriteria) return false;

        // Health filters
        if (filters.healthFilters.diabetesFriendly && !meal.diabetesFriendly) {
          return false;
        }

        if (filters.healthFilters.culturalPreference.length > 0) {
          const hasMatchingCulture = meal.foods.some((food) =>
            food.culturalOrigin?.some((origin) =>
              filters.healthFilters.culturalPreference.includes(origin)
            )
          );
          if (!hasMatchingCulture) return false;
        }

        if (filters.healthFilters.allergenFree.length > 0) {
          const hasAllergen = meal.foods.some((food) =>
            food.ingredients.some((ing) =>
              ing.allergens.some((allergen) =>
                filters.healthFilters.allergenFree.includes(allergen)
              )
            )
          );
          if (hasAllergen) return false;
        }

        return true;
      });

      // Return day only if it has meals after filtering
      return filteredMeals.length > 0;
    })
    .map((day) => ({
      ...day,
      meals: day.meals.filter((meal) => {
        // TODO: Apply the same meal filters here
        // This ensures we only include filtered meals in the final data
        return true; // Replace with actual filtering logic
      }),
    }));
};

import React from "react";
import { motion } from "framer-motion";
import { FilterOptions, UserPreferences } from "../types";
import { MEAL_TYPES, COLOR_SCHEMES, NUTRITIONAL_RANGES } from "../constants";
import { Slider } from "./Slider";
import { MealBinConfigurator } from "./MealBinConfigurator";

interface FilterPanelProps {
  filters: FilterOptions;
  userPreferences: UserPreferences;
  onFilterChange: (filters: FilterOptions) => void;
  mealBinNames: string[];
  onMealBinNamesUpdate: (newNames: string[]) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  userPreferences,
  onFilterChange,
  mealBinNames,
  onMealBinNamesUpdate,
}) => {
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    onFilterChange({
      dateRange: filters.dateRange, // Preserve date range
      mealTypes: [],
      foodTypes: [],
      ingredients: [],
      nutritionalRange: {
        calories: { min: 0, max: NUTRITIONAL_RANGES.calories.max },
        carbs: { min: 0, max: NUTRITIONAL_RANGES.carbs.max },
        protein: { min: 0, max: NUTRITIONAL_RANGES.protein.max },
        fat: { min: 0, max: NUTRITIONAL_RANGES.fat.max },
      },
      healthFilters: {
        diabetesFriendly: false,
        culturalPreference: [],
        allergenFree: [],
      },
    });
  };

  return (
    <div className="p-4 space-y-6">
      <MealBinConfigurator
        mealBinNames={mealBinNames}
        onUpdate={onMealBinNamesUpdate}
      />

      {/* Section: Meal Types */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Meal Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_TYPES.map((type) => (
            <motion.label
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative flex items-center group"
            >
              <input
                type="checkbox"
                checked={filters.mealTypes.includes(type)}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...filters.mealTypes, type]
                    : filters.mealTypes.filter((t) => t !== type);
                  handleFilterChange("mealTypes", newTypes);
                }}
                className="peer sr-only"
              />
              <div
                className="w-full p-2 rounded-md border-2 transition-all cursor-pointer
                peer-checked:border-blue-500 peer-checked:bg-blue-50
                group-hover:border-blue-200"
                style={{
                  borderColor: filters.mealTypes.includes(type)
                    ? COLOR_SCHEMES.meal[type]
                    : "transparent",
                  backgroundColor: `${COLOR_SCHEMES.meal[type]}15`,
                }}
              >
                <span
                  className="text-sm font-medium capitalize"
                  style={{ color: COLOR_SCHEMES.meal[type] }}
                >
                  {type.replace("_", " ")}
                </span>
              </div>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Section: Health Preferences */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Health Preferences
        </h3>
        <div className="space-y-4">
          {/* Diabetes-Friendly Toggle */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.healthFilters.diabetesFriendly}
              onChange={(e) =>
                handleFilterChange("healthFilters", {
                  ...filters.healthFilters,
                  diabetesFriendly: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Diabetes-Friendly
            </span>
          </label>

          {/* Cultural Preferences */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Cultural Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {userPreferences.culturalPreferences.map((cuisine) => (
                <motion.button
                  key={cuisine}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const current = filters.healthFilters.culturalPreference;
                    const updated = current.includes(cuisine)
                      ? current.filter((c) => c !== cuisine)
                      : [...current, cuisine];
                    handleFilterChange("healthFilters", {
                      ...filters.healthFilters,
                      culturalPreference: updated,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.healthFilters.culturalPreference.includes(cuisine)
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cuisine.replace("_", " ")}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Nutritional Ranges */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Nutritional Ranges
        </h3>
        <div className="space-y-6">
          {Object.entries(filters.nutritionalRange).map(([key, range]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key}
                </label>
                <span className="text-sm text-gray-500">
                  {range.min} - {range.max} {key === "calories" ? "kcal" : "g"}
                </span>
              </div>
              <Slider
                min={
                  NUTRITIONAL_RANGES[key as keyof typeof NUTRITIONAL_RANGES].min
                }
                max={
                  NUTRITIONAL_RANGES[key as keyof typeof NUTRITIONAL_RANGES].max
                }
                value={[range.min, range.max]}
                onChange={([min, max]) =>
                  handleFilterChange("nutritionalRange", {
                    ...filters.nutritionalRange,
                    [key]: { min, max },
                  })
                }
                step={key === "calories" ? 50 : 5}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange(filters)} // Replace with actual reset logic
        className="w-full py-2.5 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        Reset Filters
      </motion.button>
    </div>
  );
};

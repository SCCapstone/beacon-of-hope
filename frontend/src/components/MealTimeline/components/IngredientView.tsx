import React, { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
} from "../types";
import { format, isSameDay } from "date-fns";
import { COLOR_SCHEMES } from "../constants";

interface IngredientViewProps {
  selectedDateData: DayMeals | undefined; // Data for the single selected day
  onIngredientSelect: (ingredient: Ingredient | null) => void;
  selectedIngredient: Ingredient | null;
  mealBinNames: string[]; // Keep for consistency, might adapt later
  onMealBinUpdate: (newBinNames: string[]) => void;
  selectedRecommendation: MealRecommendation | null;
  selectedDate: Date;
}

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Helper to find primary nutrient
const getPrimaryNutrient = (
  nutritionalInfo: NutritionalInfo
): string | null => {
  const { protein, carbs, fat, fiber } = nutritionalInfo;
  if (fiber > 3) return "Fiber Source"; // Prioritize fiber
  const macros = { protein, carbs, fat };
  let primary: keyof typeof macros | null = null;
  let maxValue = 0;

  for (const key in macros) {
    if (macros[key as keyof typeof macros] > maxValue) {
      maxValue = macros[key as keyof typeof macros];
      primary = key as keyof typeof macros;
    }
  }
  if (primary && maxValue > 5) {
    // Only show if significant amount
    return `${primary.charAt(0).toUpperCase() + primary.slice(1)} Source`;
  }
  return null;
};

// Ingredient Card
const IngredientCard: React.FC<{
  ingredient: Ingredient;
  isSelected: boolean;
  isRecommended: boolean;
  onClick: () => void;
}> = ({ ingredient, isSelected, isRecommended, onClick }) => {
  const categoryColor =
    COLOR_SCHEMES.ingredient[
      ingredient.category as keyof typeof COLOR_SCHEMES.ingredient
    ] || "#cccccc";

  const primaryNutrient = getPrimaryNutrient(ingredient.nutritionalInfo);

  return (
    <motion.div
      key={`ingredient-${ingredient.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`relative p-2 mb-1 rounded cursor-pointer text-xs flex items-center space-x-2
        ${isSelected ? "ring-2 ring-orange-500 bg-white" : "bg-gray-50 hover:bg-gray-100"}
        ${isRecommended ? "border-green-400 border-l-4 pl-1" : ""} // Recommended style
      `}
      onClick={onClick}
    >
      {isRecommended && (
        <span className="absolute -top-1 -left-1 text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full z-10">
          Rec
        </span>
      )}
      <div
        className="w-2 h-6 rounded-sm flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
        title={`Category: ${ingredient.category}`}
      ></div>
      <div className="flex-grow overflow-hidden">
        <h5 className="font-medium text-gray-800 truncate">
          {ingredient.name}
        </h5>
        <p className="text-gray-500">
          {ingredient.amount} {ingredient.unit}
        </p>
      </div>
      <div className="text-right flex-shrink-0 space-y-1">
        <div className="text-gray-600">
          {ingredient.nutritionalInfo.calories} cal
        </div>
        {primaryNutrient && (
          <span className="inline-block px-1 py-0.5 bg-purple-100 text-purple-800 text-[10px] rounded-full">
            {primaryNutrient}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const IngredientView: React.FC<IngredientViewProps> = ({
  selectedDateData,
  onIngredientSelect,
  selectedIngredient,
  mealBinNames,
  onMealBinUpdate,
  selectedRecommendation,
  // selectedDate,
}) => {

  // Memoize the set of recommended ingredient IDs for the selected date
  const recommendedIngredientIds = useMemo(() => {
    const ids = new Set<string>();
    if (
      selectedRecommendation &&
      selectedRecommendation.meal.date &&
      selectedDateData && // Ensure selectedDateData exists
      isSameDay(normalizeDate(selectedRecommendation.meal.date), normalizeDate(selectedDateData.date)) // Compare recommendation's date with the date being viewed
    ) {
      selectedRecommendation.meal.foods.forEach((food) => {
        food.ingredients.forEach((ing) => ids.add(ing.id));
      });
    }
    return ids;
  }, [selectedRecommendation, selectedDateData]);


  const getIngredientsForDay = useCallback((): Ingredient[] => {
    if (!selectedDateData) return [];

    const allIngredients: Ingredient[] = [];
    const ingredientIds = new Set<string>();

    selectedDateData.meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        food.ingredients.forEach((ingredient) => {
          const uniqueKey = ingredient.id || ingredient.name.toLowerCase();
          if (!ingredientIds.has(uniqueKey)) {
            allIngredients.push(ingredient);
            ingredientIds.add(uniqueKey);
          }
        });
      });
    });

    // Sort ingredients alphabetically or by category
    allIngredients.sort((a, b) => a.name.localeCompare(b.name));

    return allIngredients;
  }, [selectedDateData]);

  const ingredients = getIngredientsForDay();

  const organizeIngredientsIntoBins = useCallback(() => {
    const bins: Record<string, Ingredient[]> = {};
    const categories = [
      ...new Set(ingredients.map((ing) => ing.category || "other")),
    ];

    // Auto-adjust bins based on categories
    const currentBinNames = [...mealBinNames]; // Use a local copy for this render cycle
    const requiredBinNames = [...new Set([...currentBinNames, ...categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1))])];

    if (requiredBinNames.length > currentBinNames.length) {
       // Defer update to avoid state change during render
       setTimeout(() => onMealBinUpdate(requiredBinNames), 0);
    }

    // Use requiredBinNames for this render to potentially show new categories immediately
    requiredBinNames.forEach((name) => (bins[name] = []));

    ingredients.forEach((ing) => {
      const categoryName = (ing.category || "Other").charAt(0).toUpperCase() + (ing.category || "other").slice(1);
      const targetBin = requiredBinNames.find(
        (bin) => bin.toLowerCase() === categoryName.toLowerCase()
      );
      if (targetBin && bins[targetBin]) {
        bins[targetBin].push(ing);
      } else if (bins["Other"]) { // Fallback to 'Other' bin if exists
        bins["Other"].push(ing);
      } else if (requiredBinNames.length > 0) { // Fallback to first bin otherwise
         bins[requiredBinNames[0]].push(ing);
      }
    });

    return { bins, displayBinNames: requiredBinNames }; // Return bins and the names used for display
  }, [ingredients, mealBinNames, onMealBinUpdate]);

  const { bins, displayBinNames } = organizeIngredientsIntoBins();
  const currentDate = selectedDateData?.date || new Date(); // Use optional chaining

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Fixed header for bins (categories) */}
      <div className="flex border-b bg-white z-10 sticky top-0">
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700">
          {format(currentDate, "MMM d, yyyy")}
        </div>
        {mealBinNames.map((binName, index) => (
          <div
            key={binName}
            className={`flex-1 p-4 text-center font-medium text-gray-700 capitalize ${
              index > 0 ? "border-l" : ""
            }`}
          >
            {binName}
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Optional: Sidebar */}
        <div className="w-32 flex-shrink-0 p-4 border-r bg-white">
          <h4 className="font-medium text-sm mb-2">Day Summary</h4>
          <p className="text-xs text-gray-600">
            Unique Ingredients: {ingredients.length}
          </p>
          {/* Add more summary info */}
        </div>

        {/* Ingredient Bins */}
        <div className="flex flex-1">
          {displayBinNames.map((binName, index) => (
            <div
              key={`${currentDate.toISOString()}-${binName}`}
              className={`flex-1 p-2 overflow-y-auto ${
                index > 0 ? "border-l" : ""
              }`}
            >
              <AnimatePresence>
                {bins[binName]?.map((ingredient) => (
                  <IngredientCard
                    key={ingredient.id || ingredient.name}
                    ingredient={ingredient}
                    isSelected={selectedIngredient?.id === ingredient.id}
                    isRecommended={recommendedIngredientIds.has(ingredient.id)}
                    onClick={() =>
                      onIngredientSelect(
                        selectedIngredient?.id === ingredient.id
                          ? null
                          : ingredient
                      )
                    }
                  />
                ))}
              </AnimatePresence>
              {/* Empty State */}
              {!bins[binName] ||
                (bins[binName].length === 0 && (
                  <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                    No ingredients
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

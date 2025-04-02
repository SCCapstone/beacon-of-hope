import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayMeals, Ingredient } from "../types";
import { format } from "date-fns";
import { COLOR_SCHEMES } from "../constants";

interface IngredientViewProps {
  selectedDateData: DayMeals | undefined; // Data for the single selected day
  onIngredientSelect: (ingredient: Ingredient | null) => void;
  selectedIngredient: Ingredient | null;
  mealBinNames: string[]; // Keep for consistency, might adapt later
  onMealBinUpdate: (newBinNames: string[]) => void;
  // Add other props if needed
}

// Placeholder Ingredient Card
const IngredientCard: React.FC<{
  ingredient: Ingredient;
  isSelected: boolean;
  onClick: () => void;
}> = ({ ingredient, isSelected, onClick }) => {
  const categoryColor =
    COLOR_SCHEMES.ingredient[
      ingredient.category as keyof typeof COLOR_SCHEMES.ingredient
    ] || "#cccccc";

  return (
    <motion.div
      key={`ingredient-${ingredient.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`p-2 mb-1 rounded cursor-pointer text-xs flex items-center space-x-2
        ${
          isSelected
            ? "ring-2 ring-orange-500 bg-white"
            : "bg-gray-50 hover:bg-gray-100"
        }
      `}
      onClick={onClick}
    >
      <div
        className="w-2 h-6 rounded-sm flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
      ></div>
      <div className="flex-grow overflow-hidden">
        <h5 className="font-medium text-gray-800 truncate">
          {ingredient.name}
        </h5>
        <p className="text-gray-500">
          {ingredient.amount} {ingredient.unit}
        </p>
      </div>
      <div className="text-right flex-shrink-0 text-gray-600">
        {ingredient.nutritionalInfo.calories} cal
      </div>
    </motion.div>
  );
};

export const IngredientView: React.FC<IngredientViewProps> = ({
  selectedDateData,
  onIngredientSelect,
  selectedIngredient,
  mealBinNames, // Use for potential ingredient categorization later
  onMealBinUpdate,
}) => {
  // Helper to get all *unique* ingredients for the selected day
  const getIngredientsForDay = useCallback((): Ingredient[] => {
    if (!selectedDateData) return [];

    const allIngredients: Ingredient[] = [];
    const ingredientIds = new Set<string>(); // Track unique ingredient IDs (using name as proxy if ID is weak)

    selectedDateData.meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        food.ingredients.forEach((ingredient) => {
          const uniqueKey = ingredient.id || ingredient.name.toLowerCase(); // Use name if ID is missing/generic
          if (!ingredientIds.has(uniqueKey)) {
            allIngredients.push(ingredient);
            ingredientIds.add(uniqueKey);
          }
          // TODO: Could potentially aggregate amounts here if needed
        });
      });
    });

    // Sort ingredients alphabetically or by category
    allIngredients.sort((a, b) => a.name.localeCompare(b.name));

    return allIngredients;
  }, [selectedDateData]);

  const ingredients = getIngredientsForDay();

  // TODO: Implement binning logic for ingredients (e.g., by category)
  const organizeIngredientsIntoBins = useCallback(() => {
    const bins: Record<string, Ingredient[]> = {};
    const categories = [
      ...new Set(ingredients.map((ing) => ing.category || "other")),
    ];

    // Ensure enough bins exist, potentially based on categories
    if (categories.length > mealBinNames.length) {
      const newNames = [...mealBinNames];
      categories
        .slice(mealBinNames.length)
        .forEach((cat) =>
          newNames.push(cat.charAt(0).toUpperCase() + cat.slice(1))
        );
      onMealBinUpdate(newNames);
      // Return current bins for this render, update will happen next render
      mealBinNames.forEach((name) => (bins[name] = []));
      bins[mealBinNames[0]] = ingredients; // Put all in first bin for now
      return bins;
    }

    mealBinNames.forEach((name) => (bins[name] = []));

    // Simple distribution: by category matching bin name (case-insensitive) or put in first bin
    ingredients.forEach((ing) => {
      const categoryName = (ing.category || "other").toLowerCase();
      const targetBin = mealBinNames.find(
        (bin) => bin.toLowerCase() === categoryName
      );
      if (targetBin && bins[targetBin]) {
        bins[targetBin].push(ing);
      } else if (mealBinNames.length > 0) {
        // Fallback to the first bin if no category match or 'other'
        bins[mealBinNames[0]].push(ing);
      }
    });

    return bins;
  }, [ingredients, mealBinNames, onMealBinUpdate]);

  const bins = organizeIngredientsIntoBins();
  const currentDate = selectedDateData?.date || new Date(); // Get the date for display

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Fixed header for bins (maybe categories?) */}
      <div className="flex border-b bg-white z-10 sticky top-0">
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700">
          {format(currentDate, "MMM d, yyyy")}
        </div>
        {mealBinNames.map((binName) => (
          <div
            key={binName}
            className="flex-1 p-4 text-center font-medium text-gray-700 border-l capitalize"
          >
            {binName} {/* Display bin name (e.g., Category) */}
          </div>
        ))}
      </div>

      {/* Content area for the single day */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Optional: Sidebar for the date (less relevant here) */}
        <div className="w-32 flex-shrink-0 p-4 border-r bg-white">
          {/* Maybe summary stats for the day? */}
          <h4 className="font-medium text-sm mb-2">Day Summary</h4>
          <p className="text-xs text-gray-600">
            Total Ingredients: {ingredients.length}
          </p>
          {/* Add more summary info */}
        </div>

        {/* Ingredient Bins */}
        <div className="flex flex-1">
          {mealBinNames.map((binName) => (
            <div
              key={`${currentDate.toISOString()}-${binName}`}
              className="flex-1 p-2 border-l overflow-y-auto"
            >
              <AnimatePresence>
                {bins[binName]?.map((ingredient) => (
                  <IngredientCard
                    key={ingredient.id || ingredient.name} // Use name as fallback key
                    ingredient={ingredient}
                    isSelected={selectedIngredient?.id === ingredient.id}
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
                    No ingredients in this category
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
  DayRecommendations,
} from "../types";
import { format, isSameDay } from "date-fns";
import { COLOR_SCHEMES } from "../constants";

interface IngredientViewProps {
  selectedDateData: DayMeals | undefined;
  recommendationData: DayRecommendations[];
  onIngredientSelect: (ingredient: Ingredient | null) => void;
  selectedIngredient: Ingredient | null;
  mealBinNames: string[];
  onMealBinUpdate: (newBinNames: string[]) => void;
  selectedRecommendation: MealRecommendation | null; // Kept for highlighting/simulation
  selectedDate: Date;
}

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

interface IngredientViewProps {
  selectedDateData: DayMeals | undefined;
  onIngredientSelect: (ingredient: Ingredient | null) => void;
  selectedIngredient: Ingredient | null;
  mealBinNames: string[]; // Keep prop for potential future use, but logic uses categories
  onMealBinUpdate: (newBinNames: string[]) => void; // Keep prop
  selectedRecommendation: MealRecommendation | null;
  // selectedDate, // Keep prop
}

const getPrimaryNutrient = (
  nutritionalInfo: NutritionalInfo | undefined // Allow undefined
): string | null => {
  if (!nutritionalInfo) return null; // Handle undefined case
  const { protein = 0, carbs = 0, fat = 0, fiber = 0 } = nutritionalInfo; // Default values
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
  // Defensive check for nutritionalInfo
  const calories = ingredient.nutritionalInfo?.calories ?? 0;

  return (
    <motion.div
      key={`ingredient-${ingredient.id}-${isRecommended}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`relative p-1.5 mb-1.5 rounded cursor-pointer text-xs flex items-center space-x-2
        ${
          isRecommended
            ? "bg-green-50/50 border border-dashed border-green-200"
            : "bg-gray-50 border border-transparent hover:bg-gray-100"
        }
        ${isSelected ? "ring-1 ring-orange-400 bg-white" : ""}
      `}
      onClick={onClick}
    >
      {isRecommended && (
        <span className="absolute -top-1 -left-1 text-[8px] bg-green-500 text-white px-1 py-0.5 rounded-full z-10 shadow-sm">
          Rec
        </span>
      )}
      <div
        className="w-1.5 h-5 rounded-sm flex-shrink-0"
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
      <div className="text-right flex-shrink-0 space-y-0.5">
        <div className="text-gray-600 text-[11px]">{calories} cal</div>
        {primaryNutrient && (
          <span className="inline-block px-1 py-0.5 bg-purple-100 text-purple-800 text-[9px] rounded-full">
            {primaryNutrient}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const IngredientView: React.FC<IngredientViewProps> = ({
  selectedDateData,
  recommendationData, // Destructure the new prop
  onIngredientSelect,
  selectedIngredient,
  selectedRecommendation,
}) => {
  const getCombinedIngredientsForDay = useCallback((): Array<
    Ingredient & { isRecommended: boolean }
  > => {
    if (!selectedDateData) {
      console.log(
        "IngredientView: getCombinedIngredientsForDay - No selectedDateData"
      );
      return [];
    }
    // Defensive check for valid date
    if (
      !(selectedDateData.date instanceof Date) ||
      isNaN(selectedDateData.date.getTime())
    ) {
      console.error(
        "IngredientView: Invalid date in selectedDateData",
        selectedDateData.date
      );
      return [];
    }
    const targetDate = selectedDateData.date;
    const normalizedTargetDate = normalizeDate(targetDate);
    console.log(`IngredientView: getCombinedIngredientsForDay for ${format(targetDate, "yyyy-MM-dd")}`);

    // 1. Get Trace Ingredients
    const traceIngredients: Ingredient[] = [];
    const traceIngredientKeys = new Set<string>(); // Use uniqueKey
    (selectedDateData.meals || []).forEach((meal) => {
      (meal.foods || []).forEach((food) => {
        (food.ingredients || []).forEach((ingredient) => {
          if (ingredient && (ingredient.id || ingredient.name)) {
            const uniqueKey = ingredient.id || ingredient.name.toLowerCase();
            if (!traceIngredientKeys.has(uniqueKey)) {
              traceIngredients.push(ingredient);
              traceIngredientKeys.add(uniqueKey);
            }
          }
        });
      });
    });
    console.log(` -> Found ${traceIngredients.length} trace ingredients.`);

    // 2. Get ALL Recommended Ingredients for this date from recommendationData
    const dayRecommendations = recommendationData.find((dayRec) =>
      isSameDay(normalizeDate(new Date(dayRec.date)), normalizedTargetDate)
    );

    const allRecommendedIngredientsForDate: Ingredient[] = [];
    const allRecommendedIngredientKeysForDate = new Set<string>(); // Use uniqueKey

    if (dayRecommendations) {
      (dayRecommendations.recommendations || []).forEach((rec) => {
        (rec.meal.foods || []).forEach((food) => {
          (food.ingredients || []).forEach((ing) => {
            if (ing && (ing.id || ing.name)) {
               const uniqueKey = ing.id || ing.name.toLowerCase();
               allRecommendedIngredientKeysForDate.add(uniqueKey);
               // Add to list only if not already added
               if (!allRecommendedIngredientsForDate.some(i => (i.id || i.name.toLowerCase()) === uniqueKey)) {
                   allRecommendedIngredientsForDate.push(ing);
               }
            }
          });
        });
      });
    }
    console.log(` -> Found ${allRecommendedIngredientsForDate.length} unique recommended ingredients for this date from recommendationData.`);

    // 3. Filter recommended ingredients to only include those *not* already in traces
    const uniqueNewRecommendedIngredients = allRecommendedIngredientsForDate.filter(
        (ing) => ing && (ing.id || ing.name) && !traceIngredientKeys.has(ing.id || ing.name.toLowerCase()) // Add defensive checks
    );
    console.log(` -> Found ${uniqueNewRecommendedIngredients.length} recommended ingredients not present in trace.`);

    // 4. Combine and Mark
    const combinedIngredients = [
      ...traceIngredients.map((ing) => ({
        ...ing,
        isRecommended: allRecommendedIngredientKeysForDate.has(
          ing.id || ing.name.toLowerCase()
        ),
      })),
      ...uniqueNewRecommendedIngredients.map((ing) => ({
        ...ing,
        isRecommended: true,
      })),
    ];
    console.log(` -> Total combined ingredients for ${format(targetDate, "yyyy-MM-dd")}: ${combinedIngredients.length}`);


    combinedIngredients.sort((a, b) => {
      if (a.category !== b.category) return (a.category || "z").localeCompare(b.category || "z");
      return a.name.localeCompare(b.name);
    });

    return combinedIngredients;
  }, [selectedDateData, recommendationData]
  );

  const ingredients = getCombinedIngredientsForDay();

  // organizeIngredientsIntoBins remains the same, uses the result of the updated getCombinedIngredientsForDay
  const organizeIngredientsIntoBins = useCallback(() => {
    // ... (logic remains the same, uses the 'ingredients' variable from above)
    const bins: Record<string, Array<Ingredient & { isRecommended: boolean }>> = {};
    const categories = [
      ...new Set(ingredients.map((ing) => ing.category || "other")),
    ].sort();
    const displayBinNames = categories.map(
      (cat) => cat.charAt(0).toUpperCase() + cat.slice(1)
    );
    displayBinNames.forEach((name) => (bins[name] = []));
    if (!displayBinNames.includes("Other") && categories.includes("other")) {
      bins["Other"] = [];
    }
    ingredients.forEach((ing) => {
      const categoryName =
        (ing.category || "Other").charAt(0).toUpperCase() +
        (ing.category || "other").slice(1);
      if (bins[categoryName]) {
        bins[categoryName].push(ing);
      } else if (bins["Other"]) {
        bins["Other"].push(ing);
      }
    });
    return { bins, displayBinNames };
  }, [ingredients]);

  const { bins, displayBinNames } = organizeIngredientsIntoBins();

  console.log(
    `IngredientView: Rendering component. Date: ${
      selectedDateData ? format(selectedDateData.date, "yyyy-MM-dd") : "N/A"
    }. Bins to display: ${displayBinNames.length}`
  );
  if (!selectedDateData) {
    console.warn("IngredientView: No selectedDateData provided.");
    return (
      <div className="p-4 text-center text-gray-500">
        Select a date to view ingredients.
      </div>
    );
  }
  // Add check for valid date object again before rendering
  if (
    !(selectedDateData.date instanceof Date) ||
    isNaN(selectedDateData.date.getTime())
  ) {
    console.error(
      "IngredientView: Invalid date in selectedDateData before render",
      selectedDateData.date
    );
    return (
      <div className="p-4 text-center text-red-500">
        Error: Invalid date selected.
      </div>
    );
  }
  const currentDate = selectedDateData.date;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Fixed header for bins (categories) */}
      <div className="flex border-b bg-white z-10 sticky top-0">
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700 border-r">
          {format(currentDate, "MMM d, yyyy")}
        </div>
        {displayBinNames.map((binName, index) => (
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
        <div className="flex flex-1 overflow-x-auto">
          {" "}
          {/* Allow horizontal scroll if many categories */}
          {displayBinNames.map((binName, index) => {
            const binContent = bins[binName];
            console.log(
              ` -> Rendering Bin '${binName}'. Items: ${binContent?.length ?? 0}`
            );
            if (binContent && binContent.length > 0) {
              console.log(
                "   -> Bin Content:",
                binContent.map((i) => ({
                  name: i.name,
                  id: i.id,
                  isRec: i.isRecommended,
                }))
              );
            }

            return (
              <div
                key={`${selectedDateData?.date.toISOString()}-${binName}`} // Use optional chaining
                className={`flex-1 p-1.5 overflow-y-auto min-w-[150px] ${
                  // Set min-width for bins
                  index > 0 ? "border-l" : ""
                }`}
              >
                <AnimatePresence>
                  {binContent?.map((ingredient) => (
                    <IngredientCard
                      key={`${ingredient.id || ingredient.name}-${
                        ingredient.isRecommended
                      }`}
                      ingredient={ingredient}
                      isSelected={
                        selectedIngredient?.id === ingredient.id || // Check ID first
                        (!selectedIngredient?.id && !ingredient.id && selectedIngredient?.name === ingredient.name) // Fallback to name if IDs missing
                      }
                      isRecommended={ingredient.isRecommended} // This is now correctly determined
                      onClick={() =>
                        onIngredientSelect(
                          (selectedIngredient?.id === ingredient.id ||
                          (!selectedIngredient?.id && !ingredient.id && selectedIngredient?.name === ingredient.name))
                            ? null
                            : ingredient
                        )
                      }
                    />
                  ))}
                </AnimatePresence>

                {/* Empty State */}
                {(!binContent || binContent.length === 0) && (
                  <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs p-2">
                    -
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

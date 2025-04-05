import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
  DayRecommendations,
} from "../types";
import { format, isSameDay, startOfDay, isValid as isValidDate, parseISO } from "date-fns";
import { COLOR_SCHEMES } from "../constants";

// Robust date normalization
const normalizeDate = (date: Date | string | null | undefined): Date => {
  if (date === null || date === undefined) {
    console.warn(
      "IngredientView normalizeDate received null/undefined, returning current date."
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn(
      "IngredientView normalizeDate received invalid date, returning current date:",
      date
    );
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }
  return startOfDay(dateObj); // Use startOfDay for robust normalization
};

// Use isSameDay from date-fns for consistency
const isSameNormalizedDay = (
  date1: Date | string | null | undefined,
  date2: Date | string | null | undefined
): boolean => {
  if (!date1 || !date2) return false;
  // Ensure both are normalized Date objects before comparing
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  // Check if normalization resulted in valid dates before comparing
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return isSameDay(d1, d2);
};

// Helper to get a unique key for an ingredient
const getIngredientKey = (ingredient: Ingredient): string | null => {
  if (ingredient.id) return ingredient.id;
  if (ingredient.name) return ingredient.name.toLowerCase().trim();
  console.warn("Ingredient missing both id and name:", ingredient);
  return null; // Cannot generate a reliable key
};

interface IngredientViewProps {
  selectedDateData: DayMeals | undefined;
  recommendationData: DayRecommendations[];
  onIngredientSelect: (ingredient: Ingredient | null, isRecommended?: boolean) => void;
  selectedIngredient: Ingredient | null;
  mealBinNames: string[];
  onMealBinUpdate: (newBinNames: string[]) => void;
  selectedRecommendation: MealRecommendation | null; // Kept for highlighting/simulation
  selectedDate: Date;
}

interface IngredientViewProps {
  selectedDateData: DayMeals | undefined; // Data for the *single* selected date
  recommendationData: DayRecommendations[]; // All recommendation data
  onIngredientSelect: (ingredient: Ingredient | null, isRecommended?: boolean) => void;
  selectedIngredient: Ingredient | null;
  mealBinNames: string[]; // Keep prop for potential future use (though categories are used now)
  onMealBinUpdate: (newBinNames: string[]) => void; // Keep prop
  selectedRecommendation: MealRecommendation | null; // For context/highlighting
  selectedDate: Date; // The currently selected date from the parent
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
      key={`ingredient-${getIngredientKey(ingredient)}-${isRecommended}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`ingredient-card-item relative p-1.5 mb-1.5 rounded cursor-pointer text-xs flex items-center space-x-2
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
  selectedDateData, // Data for the specific selected date
  recommendationData, // All recommendations
  onIngredientSelect,
  selectedIngredient,
  // mealBinNames, // Not used for binning, but kept for props interface consistency
  // onMealBinUpdate, // Keep prop
  // selectedRecommendation, // Keep prop for context if needed later
  selectedDate, // Use this prop for finding recommendations
}) => {

  // Refined function to get combined ingredients using Map
  const getCombinedIngredientsForDay = useCallback((): Array<Ingredient & { isRecommended: boolean }> => {
    const normalizedTargetDate = normalizeDate(selectedDate); // Use the selectedDate prop
    if (!isValidDate(normalizedTargetDate)) {
        console.error("IngredientView: Invalid selectedDate prop received:", selectedDate);
        return [];
    }
    console.log(`IngredientView: getCombinedIngredientsForDay for ${format(normalizedTargetDate, "yyyy-MM-dd")}`);

    // 1. Get Trace Ingredients from selectedDateData prop
    const traceIngredients: Ingredient[] = [];
    if (selectedDateData && isSameNormalizedDay(selectedDateData.date, normalizedTargetDate)) {
        (selectedDateData.meals || []).forEach((meal) => {
            (meal.foods || []).forEach((food) => {
                (food.ingredients || []).forEach((ingredient) => {
                    const key = getIngredientKey(ingredient);
                    if (key && !traceIngredients.some(t => getIngredientKey(t) === key)) {
                        traceIngredients.push(ingredient);
                    }
                });
            });
        });
    } else {
        // This case might happen briefly during date transitions if props haven't fully updated.
        // console.log("IngredientView: selectedDateData does not match selectedDate prop yet.");
    }
    console.log(` -> Found ${traceIngredients.length} unique trace ingredients from selectedDateData.`);

    // 2. Get Recommended Ingredients for the target date from recommendationData
    const dayRecommendations = recommendationData.find((dayRec) =>
      isSameNormalizedDay(dayRec.date, normalizedTargetDate)
    );
    const recommendedIngredients: Ingredient[] = [];
    if (dayRecommendations) {
        (dayRecommendations.recommendations || []).forEach((rec) => {
            (rec.meal.foods || []).forEach((food) => {
                (food.ingredients || []).forEach((ing) => {
                    const key = getIngredientKey(ing);
                    if (key && !recommendedIngredients.some(r => getIngredientKey(r) === key)) {
                        recommendedIngredients.push(ing);
                    }
                });
            });
        });
    }
    console.log(` -> Found ${recommendedIngredients.length} unique recommended ingredients from recommendationData.`);

    // 3. Combine using a Map
    const combinedIngredientMap = new Map<string, Ingredient & { isRecommended: boolean }>();

    // Add trace ingredients first
    traceIngredients.forEach(ing => {
        const key = getIngredientKey(ing);
        if (key) {
            combinedIngredientMap.set(key, { ...ing, isRecommended: false });
        }
    });

    // Add/update with recommended ingredients
    recommendedIngredients.forEach(ing => {
        const key = getIngredientKey(ing);
        if (key) {
            if (combinedIngredientMap.has(key)) {
                const existing = combinedIngredientMap.get(key)!;
                combinedIngredientMap.set(key, { ...existing, isRecommended: true });
            } else {
                combinedIngredientMap.set(key, { ...ing, isRecommended: true });
            }
        }
    });

    // 4. Convert map back to array and sort
    const combinedIngredients = Array.from(combinedIngredientMap.values());
    combinedIngredients.sort((a, b) => {
      if (a.category !== b.category) return (a.category || "z").localeCompare(b.category || "z");
      return a.name.localeCompare(b.name);
    });

    console.log(` -> Total combined ingredients for ${format(normalizedTargetDate, "yyyy-MM-dd")}: ${combinedIngredients.length}`);
    return combinedIngredients;

  }, [selectedDate, selectedDateData, recommendationData]); // Dependencies updated

  const ingredients = getCombinedIngredientsForDay();

  // Organize ingredients into bins based on category
  const organizeIngredientsIntoBins = useCallback(() => {
    const bins: Record<string, Array<Ingredient & { isRecommended: boolean }>> = {};
    // Determine categories from the combined list
    const categories = [
      ...new Set(ingredients.map((ing) => ing.category || "other")),
    ].sort();

    // Create bin names (capitalized categories)
    const displayBinNames = categories.map(
      (cat) => cat.charAt(0).toUpperCase() + cat.slice(1)
    );

    // Initialize bins
    displayBinNames.forEach((name) => (bins[name] = []));
    // Ensure 'Other' bin exists if 'other' category is present but not explicitly named 'Other'
    if (categories.includes("other") && !displayBinNames.includes("Other")) {
        bins["Other"] = [];
    }

    // Distribute ingredients into bins
    ingredients.forEach((ing) => {
      const categoryName = (ing.category || "other").charAt(0).toUpperCase() + (ing.category || "other").slice(1);
      // Handle cases where category might not perfectly match bin name (e.g., 'other' vs 'Other')
      const binTarget = bins[categoryName] ? categoryName : "Other";
      if (bins[binTarget]) {
          bins[binTarget].push(ing);
      } else {
          // Fallback if even 'Other' bin wasn't initialized (shouldn't happen with above logic)
          console.warn(`Could not find bin for category: ${categoryName}`);
      }
    });

    return { bins, displayBinNames };
  }, [ingredients]); // Depends only on the calculated ingredients list

  const { bins, displayBinNames } = organizeIngredientsIntoBins();

  // --- Render Logic ---

  const normalizedCurrentDate = normalizeDate(selectedDate); // Normalize for display

  // Handle loading/empty state based on selectedDateData prop
  if (!selectedDateData || !isSameNormalizedDay(selectedDateData.date, normalizedCurrentDate)) {
    // Show a loading or placeholder state if the data for the selected date isn't available *yet*
    // This might flash briefly during date transitions.
    return (
      <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
        Loading ingredients for {format(normalizedCurrentDate, "MMM d, yyyy")}...
      </div>
    );
  }

  // Add check for valid date object again before rendering (belt and suspenders)
  if (!isValidDate(normalizedCurrentDate)) {
    console.error("IngredientView: Invalid date object before render", normalizedCurrentDate);
    return (
      <div className="p-4 text-center text-red-500">
        Error: Invalid date selected.
      </div>
    );
  }

  console.log(
    `IngredientView: Rendering component. Date: ${format(normalizedCurrentDate, "yyyy-MM-dd")}. Bins to display: ${displayBinNames.length}`
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Fixed header for bins (categories) */}
      <div className="flex border-b bg-white z-10 sticky top-0">
        <div className="w-32 flex-shrink-0 p-4 font-medium text-gray-700 border-r">
          {format(normalizedCurrentDate, "MMM d, yyyy")}
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
          {displayBinNames.map((binName, index) => {
            const binContent = bins[binName];
            // console.log(` -> Rendering Bin '${binName}'. Items: ${binContent?.length ?? 0}`);

            return (
              <div
                key={`${normalizedCurrentDate.toISOString()}-${binName}`}
                className={`flex-1 p-1.5 overflow-y-auto min-w-[150px] ${
                  index > 0 ? "border-l" : ""
                }`}
              >
                <AnimatePresence>
                  {binContent?.map((ingredient) => {
                    const ingredientKey = getIngredientKey(ingredient);
                    const selectedKey = selectedIngredient ? getIngredientKey(selectedIngredient) : null;
                    const isCurrentlySelected = ingredientKey !== null && ingredientKey === selectedKey;

                    return (
                      <IngredientCard
                        // Use a robust key combining unique ID/name and recommendation status
                        key={`${ingredientKey}-${ingredient.isRecommended}`}
                        ingredient={ingredient}
                        isSelected={isCurrentlySelected}
                        isRecommended={ingredient.isRecommended}
                        onClick={() => {
                          // console.log(`IngredientView: Clicked on ${ingredient.name} (Recommended: ${ingredient.isRecommended}). Current selected key: ${selectedKey}. Calling onIngredientSelect.`);
                          onIngredientSelect(
                            isCurrentlySelected ? null : ingredient,
                            ingredient.isRecommended
                          );
                        }}
                      />
                    );
                  })}
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

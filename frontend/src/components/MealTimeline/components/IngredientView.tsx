import React, { useMemo } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { Ingredient, DayMeals } from "../types";
import { COLOR_SCHEMES } from "../constants";

interface IngredientViewProps {
  weekData: DayMeals[];
  onIngredientSelect: (ingredient: Ingredient) => void;
  selectedIngredient: Ingredient | null;
}

interface IngredientAnalysis {
  id: string;
  name: string;
  category: string;
  frequency: number;
  averageAmount: number;
  unit: string;
  nutritionalAverage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  mealAppearances: Set<string>;
  timeAppearances: Set<string>;
  allergens: Set<string>;
  data: Ingredient;
}

export const IngredientView: React.FC<IngredientViewProps> = ({
  weekData,
  onIngredientSelect,
  selectedIngredient,
}) => {
  // Process ingredients data with error handling
  const { ingredientAnalysis, maxFrequency } = useMemo(() => {
    const analysis = new Map<string, IngredientAnalysis>();

    weekData.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          food.ingredients.forEach((ing) => {
            if (!analysis.has(ing.id)) {
              analysis.set(ing.id, {
                id: ing.id,
                name: ing.name,
                category: ing.category,
                frequency: 0,
                averageAmount: 0,
                unit: ing.unit,
                nutritionalAverage: {
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  fiber: 0,
                },
                mealAppearances: new Set(),
                timeAppearances: new Set(),
                allergens: new Set(ing.allergens || []),
                data: ing,
              });
            }

            const current = analysis.get(ing.id)!;
            current.frequency += 1;
            current.averageAmount += ing.amount;
            current.mealAppearances.add(meal.type);
            current.timeAppearances.add(meal.time);

            // Update nutritional averages
            Object.keys(current.nutritionalAverage).forEach((key) => {
              const nutritionKey = key as keyof typeof current.nutritionalAverage;
              current.nutritionalAverage[nutritionKey] +=
                ing.nutritionalInfo[nutritionKey];
            });
          });
        });
      });
    });

    // Calculate averages
    analysis.forEach((value) => {
      value.averageAmount = value.averageAmount / value.frequency;
      Object.keys(value.nutritionalAverage).forEach((key) => {
        const nutritionKey = key as keyof typeof value.nutritionalAverage;
        value.nutritionalAverage[nutritionKey] =
          value.nutritionalAverage[nutritionKey] / value.frequency;
      });
    });

    const maxFreq = Math.max(...Array.from(analysis.values()).map((v) => v.frequency));

    return {
      ingredientAnalysis: analysis,
      maxFrequency: maxFreq,
    };
  }, [weekData]);

  // Create treemap layout
  const treeData = useMemo(() => {
    const categories = new Map<string, Ingredient[]>();
    
    ingredientAnalysis.forEach((analysis) => {
      if (!categories.has(analysis.category)) {
        categories.set(analysis.category, []);
      }
      categories.get(analysis.category)!.push(analysis.data);
    });

    const hierarchyData = {
      name: "ingredients",
      value: 0,
      children: Array.from(categories.entries()).map(([category, ingredients]) => ({
        name: category,
        value: 0,
        children: ingredients.map((ing) => ({
          name: ing.name,
          value: ingredientAnalysis.get(ing.id)?.frequency || 1,
          data: ing,
          analysis: ingredientAnalysis.get(ing.id),
        })),
      })),
    };

    return d3
      .treemap<any>()
      .size([800, 600])
      .padding(1)
      .round(true)(d3.hierarchy(hierarchyData).sum((d) => d.value));
  }, [ingredientAnalysis]);

  const getHealthStatus = (ingredient: Ingredient) => {
    const analysis = ingredientAnalysis.get(ingredient.id);
    if (!analysis) return null;

    const gi = ingredient.nutritionalInfo.glycemicIndex;
    const isLowGI = gi ? gi < 55 : null;
    const hasHighFiber = ingredient.nutritionalInfo.fiber > 3;

    return {
      isHealthy: isLowGI !== false && hasHighFiber,
      details: [
        gi ? `GI: ${gi}` : null,
        hasHighFiber ? "High Fiber" : null,
        ingredient.diabetesFriendly ? "Diabetes-Friendly" : null,
      ].filter(Boolean),
    };
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Categories */}
        {treeData.children?.map((category: d3.HierarchyRectangularNode<any>) => (
          <g key={category.data.name} className="category-group">
            {/* Category Label */}
            <text
              x={category.x0 + 8}
              y={category.y0 + 20}
              className="font-medium text-sm fill-gray-700"
            >
              {category.data.name}
            </text>

            {/* Ingredients */}
            {category.children?.map((leaf: d3.HierarchyRectangularNode<any>) => {
              const analysis = leaf.data.analysis;
              if (!analysis) return null;

              const healthStatus = getHealthStatus(leaf.data.data);
              
              return (
                <motion.g
                  key={leaf.data.data.id}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onIngredientSelect(leaf.data.data)}
                >
                  {/* Background */}
                  <rect
                    x={leaf.x0}
                    y={leaf.y0}
                    width={leaf.x1 - leaf.x0}
                    height={leaf.y1 - leaf.y0}
                    rx={4}
                    fill={COLOR_SCHEMES.ingredient[category.data.name as keyof typeof COLOR_SCHEMES.ingredient]}
                    opacity={selectedIngredient?.id === leaf.data.data.id ? 1 : 0.7}
                    className="transition-opacity duration-200"
                  />

                  {/* Content */}
                  <g transform={`translate(${leaf.x0 + 8}, ${leaf.y0 + 16})`}>
                    {/* Name */}
                    <text className="text-sm font-medium fill-white">
                      {leaf.data.data.name}
                    </text>

                    {/* Frequency */}
                    <text y={20} className="text-xs fill-white opacity-75">
                      {analysis.frequency}x used
                    </text>

                    {/* Health Indicators */}
                    {healthStatus?.details.map((detail, index) => (
                      <text
                        key={detail}
                        y={36 + index * 16}
                        className="text-xs fill-white opacity-90"
                      >
                        {detail}
                      </text>
                    ))}
                  </g>
                </motion.g>
              );
            })}
          </g>
        ))}
      </svg>

      {/* Selected Ingredient Details */}
      {selectedIngredient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-4 top-4 w-80 bg-white rounded-lg shadow-lg p-4"
        >
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {selectedIngredient.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {selectedIngredient.category}
              </p>
            </div>

            {/* Usage Statistics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Usage</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-lg font-medium text-gray-800">
                    {ingredientAnalysis.get(selectedIngredient.id)?.frequency || 0}
                  </div>
                  <div className="text-xs text-gray-500">Times Used</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-lg font-medium text-gray-800">
                    {ingredientAnalysis
                      .get(selectedIngredient.id)
                      ?.mealAppearances.size || 0}
                  </div>
                  <div className="text-xs text-gray-500">Different Meals</div>
                </div>
              </div>
            </div>

            {/* Nutritional Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Nutritional Info (per {selectedIngredient.unit})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(selectedIngredient.nutritionalInfo)
                  .filter(([key]) => key !== "glycemicIndex")
                  .map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-sm font-medium text-gray-800">
                        {Math.round(value * 10) / 10}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Health Indicators */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Health Indicators
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedIngredient.nutritionalInfo.glycemicIndex && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    GI: {selectedIngredient.nutritionalInfo.glycemicIndex}
                  </span>
                )}
                {selectedIngredient.diabetesFriendly && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Diabetes-Friendly
                  </span>
                )}
                {selectedIngredient.allergens.length > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Contains Allergens
                  </span>
                )}
              </div>
            </div>

            {/* Allergens */}
            {selectedIngredient.allergens.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Allergens</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedIngredient.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Origin */}
            {(selectedIngredient.culturalOrigin ?? []).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Cultural Origin
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(selectedIngredient.culturalOrigin ?? []).map((origin) => (
                    <span
                      key={origin}
                      className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                    >
                      {origin.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default IngredientView;
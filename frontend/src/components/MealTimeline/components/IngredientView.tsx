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

export const IngredientView: React.FC<IngredientViewProps> = ({
  weekData,
  onIngredientSelect,
  selectedIngredient,
}) => {
  // Process ingredients data
  const { ingredients, categories } = useMemo(() => {
    const ingredientMap = new Map<string, Ingredient & { frequency: number }>();
    const categorySet = new Set<string>();

    weekData.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          food.ingredients.forEach((ing) => {
            categorySet.add(ing.category);

            if (!ingredientMap.has(ing.id)) {
              ingredientMap.set(ing.id, { ...ing, frequency: 1 });
            } else {
              const existing = ingredientMap.get(ing.id)!;
              existing.frequency += 1;
            }
          });
        });
      });
    });

    return {
      ingredients: Array.from(ingredientMap.values()),
      categories: Array.from(categorySet),
    };
  }, [weekData]);

  // Create tree layout
  const treeData = useMemo(() => {
    const root = d3.hierarchy({
      name: "ingredients",
      children: categories.map((category) => ({
        name: category,
        children: ingredients
          .filter((ing) => ing.category === category)
          .map((ing) => ({
            name: ing.name,
            value: ing.frequency,
            data: ing,
          })),
      })),
    });

    return d3.treemap<any>().size([800, 600]).padding(1)(root);
  }, [ingredients, categories]);

  return (
    <div className="relative">
      <svg width={800} height={600}>
        {/* Categories */}
        {treeData.children?.map(
          (
            category: d3.HierarchyRectangularNode<{
              name: keyof typeof COLOR_SCHEMES.ingredient;
            }>
          ) => (
            <g key={category.data.name}>
              {/* Category label */}
              <text
                x={category.x0 + 5}
                y={category.y0 + 20}
                className="font-medium text-sm fill-gray-800"
              >
                {category.data.name}
              </text>

              {/* Ingredients in category */}
              {category.children?.map((leaf: any) => (
                <motion.g
                  key={leaf.data.name}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onIngredientSelect(leaf.data.data)}
                >
                  <rect
                    x={leaf.x0}
                    y={leaf.y0}
                    width={leaf.x1 - leaf.x0}
                    height={leaf.y1 - leaf.y0}
                    fill={COLOR_SCHEMES.ingredient[category.data.name]}
                    opacity={
                      selectedIngredient?.id === leaf.data.data.id ? 1 : 0.7
                    }
                    rx={4}
                    className="cursor-pointer"
                  />

                  {/* Ingredient label */}
                  <text
                    x={leaf.x0 + 5}
                    y={leaf.y0 + 15}
                    className="text-xs fill-white"
                  >
                    {leaf.data.name}
                  </text>

                  {/* Frequency */}
                  <text
                    x={leaf.x0 + 5}
                    y={leaf.y0 + 30}
                    className="text-xs fill-white opacity-80"
                  >
                    {leaf.data.value}x
                  </text>
                </motion.g>
              ))}
            </g>
          )
        )}
      </svg>

      {/* Selected ingredient details */}
      {selectedIngredient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-4 top-4 w-72 bg-white rounded-lg shadow-lg p-4"
        >
          <h3 className="font-medium text-gray-800 mb-2">
            {selectedIngredient.name}
          </h3>

          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-500">Category:</span>
              <span className="ml-2">{selectedIngredient.category}</span>
            </div>

            <div className="text-sm">
              <span className="text-gray-500">Nutritional Info:</span>
              <div className="ml-2 grid grid-cols-2 gap-1">
                <div>
                  Calories: {selectedIngredient.nutritionalInfo.calories}
                </div>
                <div>
                  Protein: {selectedIngredient.nutritionalInfo.protein}g
                </div>
                <div>Carbs: {selectedIngredient.nutritionalInfo.carbs}g</div>
                <div>Fat: {selectedIngredient.nutritionalInfo.fat}g</div>
              </div>
            </div>

            {selectedIngredient.allergens.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-500">Allergens:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedIngredient.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedIngredient.substitutes && (
              <div className="text-sm">
                <span className="text-gray-500">Substitutes:</span>
                <div className="mt-1 space-y-1">
                  {selectedIngredient.substitutes.map((substitute) => (
                    <div key={substitute} className="text-xs text-gray-600">
                      • {substitute}
                    </div>
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

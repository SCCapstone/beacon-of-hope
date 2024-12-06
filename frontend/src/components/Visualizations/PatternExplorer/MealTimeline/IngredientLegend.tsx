// IngredientLegend.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IngredientLegendProps {
  ingredients: Set<string>;
  colorMap: Map<string, string>;
  selectedIngredients: Set<string>;
  onIngredientToggle: (ingredient: string) => void;
}

const IngredientLegend: React.FC<IngredientLegendProps> = ({
  ingredients,
  colorMap,
  selectedIngredients,
  onIngredientToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredIngredients = useMemo(() => {
    return Array.from(ingredients)
      .filter((ing) => ing.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // Sort selected ingredients first
        const aSelected = selectedIngredients.has(a);
        const bSelected = selectedIngredients.has(b);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.localeCompare(b);
      });
  }, [ingredients, searchTerm, selectedIngredients]);

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-4 max-w-xs z-10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Ingredients ({filteredIngredients.length})
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 text-sm hover:text-blue-700 px-2 py-1 leading-none"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {isExpanded && (
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search ingredients..."
            className="w-full px-2 py-1 text-sm border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {selectedIngredients.size > 0 && (
            <button
              onClick={() =>
                selectedIngredients.forEach((ing) => onIngredientToggle(ing))
              }
              className="text-xs text-red-500 mt-1 hover:text-red-700"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      <div
        className={`grid gap-1 transition-all duration-300 ${
          isExpanded ? "max-h-96" : "max-h-32"
        } overflow-y-auto`}
      >
        <AnimatePresence>
          {filteredIngredients.map((ingredient) => (
            <motion.div
              key={ingredient}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              layout
            >
              <button
                onClick={() => onIngredientToggle(ingredient)}
                className={`flex items-center w-full p-1 rounded hover:bg-gray-50 transition-colors ${
                  selectedIngredients.has(ingredient) ? "bg-gray-100" : ""
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colorMap.get(ingredient) }}
                />
                <span className="text-xs text-gray-600 ml-2 truncate">
                  {ingredient}
                </span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isExpanded && filteredIngredients.length > 6 && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          {filteredIngredients.length - 6} more ingredients...
        </div>
      )}
    </div>
  );
};

export default IngredientLegend;

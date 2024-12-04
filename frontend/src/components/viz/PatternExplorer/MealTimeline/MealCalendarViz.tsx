// MealCalendarViz.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import * as d3 from "d3";
import { DayMeals, Meal } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import MealDetailPopup from "./MealDetailPopup";
import MealComparisonPopup from "./MealComparisonPopup";
import IngredientLegend from "./IngredientLegend";
import { ColorManager } from "./utils/colorUtils";

interface MealCalendarVizProps {
  weekData: DayMeals[];
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({ weekData }) => {
  // States for interaction
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [compareMode, setCompareMode] = useState(false);
  const [comparison, setComparison] = useState<{
    meal1: Meal | null;
    meal2: Meal | null;
  }>({
    meal1: null,
    meal2: null,
  });
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set()
  );

  // Constants for visualization
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const TIME_SLOTS = ["6:00", "9:00", "12:00", "15:00", "18:00", "21:00"];

  const MARGIN = { top: 40, right: 20, bottom: 20, left: 60 };
  const MIN_WIDTH = 1000; // Minimum width
  const DEFAULT_HEIGHT = 600;

  // State for dimensions
  const [dimensions, setDimensions] = useState({
    width: MIN_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Ensure width is never less than MIN_WIDTH
        const width = Math.max(
          containerWidth - MARGIN.left - MARGIN.right,
          MIN_WIDTH
        );

        setDimensions({
          width,
          height: DEFAULT_HEIGHT,
        });
      }
    };

    // Initial update
    updateDimensions();

    // Add resize listener
    const debouncedUpdateDimensions = debounce(updateDimensions, 250);
    window.addEventListener("resize", debouncedUpdateDimensions);

    // Cleanup
    return () => {
      window.removeEventListener("resize", debouncedUpdateDimensions);
    };
  }, []);

  const WIDTH = dimensions.width - MARGIN.left - MARGIN.right;
  const HEIGHT = 600 - MARGIN.top - MARGIN.bottom;
  const MEAL_BOX_HEIGHT = 80;
  const MEAL_BOX_WIDTH = WIDTH / 7 - 20;

  // Calculate actual SVG dimensions
  const svgWidth = dimensions.width + MARGIN.left + MARGIN.right;
  const svgHeight = dimensions.height + MARGIN.top + MARGIN.bottom;

  // Create time scale
  const timeScale = d3
    .scaleTime()
    .domain([new Date("2024-01-01T06:00:00"), new Date("2024-01-01T22:00:00")])
    .range([0, HEIGHT]);

  // Initialize color manager with all unique ingredients
  const { colorManager, allIngredients } = useMemo(() => {
    const ingredients = new Set<string>();
    weekData.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.ingredients.forEach((ing) => {
          ingredients.add(ing.name);
        });
      });
    });
    return {
      colorManager: new ColorManager(Array.from(ingredients)),
      allIngredients: ingredients,
    };
  }, [weekData]);

  // Event handlers
  const handleMealClick = (meal: Meal, event: React.MouseEvent) => {
    if (compareMode && comparison.meal1) {
      setComparison((prev) => ({
        ...prev,
        meal2: meal,
      }));
      setCompareMode(false);
    } else {
      const containerBounds = containerRef.current?.getBoundingClientRect();
      const clickX = event.clientX;
      const clickY = event.clientY;

      if (containerBounds) {
        setSelectedMeal(meal);
        setPopupPosition({
          x: clickX,
          y: clickY,
        });
      }
    }
  };

  const handleCompareClick = () => {
    setCompareMode(true);
    setComparison({
      meal1: selectedMeal,
      meal2: null,
    });
    setSelectedMeal(null);
  };

  const handleIngredientToggle = (ingredient: string) => {
    setSelectedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredient)) {
        newSet.delete(ingredient);
      } else {
        newSet.add(ingredient);
      }
      return newSet;
    });
  };

  // MealBox component
  const MealBox: React.FC<{
    meal: Meal;
    x: number;
    y: number;
    isSelected: boolean;
  }> = ({ meal, x, y, isSelected }) => {
    // Calculate ingredient distributions
    const ingredientBars = useMemo(() => {
      const relevantIngredients = meal.ingredients.filter(
        (ing) =>
          selectedIngredients.size === 0 || selectedIngredients.has(ing.name)
      );
      const total = relevantIngredients.length;
      let currentX = 0;

      return relevantIngredients.map((ing) => {
        const width = (MEAL_BOX_WIDTH - 20) / total;
        const bar = {
          x: currentX,
          width,
          ingredient: ing.name,
          color: colorManager.getColor(ing.name),
        };
        currentX += width;
        return bar;
      });
    }, [meal.ingredients, selectedIngredients]);

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: isSelected
            ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))"
            : "none",
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => handleMealClick(meal, e)}
        style={{ cursor: "pointer" }}
      >
        {/* Main box */}
        <rect
          x={x}
          y={y}
          width={MEAL_BOX_WIDTH}
          height={MEAL_BOX_HEIGHT}
          rx={8}
          fill="white"
          stroke={isSelected ? "#3B82F6" : "#e2e8f0"}
          strokeWidth={isSelected ? 2 : 1}
        />

        {/* Meal name */}
        <text
          x={x + 10}
          y={y + 20}
          className="font-medium text-sm"
          fill="#2d3748"
        >
          {meal.time} - {meal.name}
        </text>

        {/* Ingredient bars */}
        <g transform={`translate(${x + 10}, ${y + 35})`}>
          <AnimatePresence>
            {ingredientBars.map((bar, idx) => (
              <motion.rect
                key={`${bar.ingredient}-${idx}`}
                x={bar.x}
                y={0}
                width={bar.width}
                height={10}
                fill={bar.color}
                rx={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <title>{bar.ingredient}</title>
              </motion.rect>
            ))}
          </AnimatePresence>
        </g>

        {/* Ingredient count */}
        <text
          x={x + 10}
          y={y + MEAL_BOX_HEIGHT - 15}
          className="text-xs"
          fill="#718096"
        >
          {meal.ingredients.length} ingredients
        </text>
      </motion.g>
    );
  };

  return (
    <div
      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-x-auto"
      ref={containerRef}
    >
      {compareMode && (
        <div className="absolute top-0 left-0 right-0 bg-blue-100 dark:bg-blue-900 p-2 text-center text-sm text-blue-800 dark:text-blue-100 rounded-t-lg">
          Select a second meal to compare
        </div>
      )}

      <svg
        width={svgWidth}
        height={svgHeight}
        className="bg-white dark:bg-gray-800"
      >
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* Day columns */}
          {DAYS.map((day, i) => {
            const x = i * (WIDTH / 7);
            return (
              <g key={day}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={HEIGHT}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />
                <text
                  x={x + WIDTH / 14}
                  y={-20}
                  textAnchor="middle"
                  className="font-medium text-gray-600"
                >
                  {day}
                </text>
              </g>
            );
          })}

          {/* Time markers */}
          {TIME_SLOTS.map((time) => {
            const [hours, minutes] = time.split(":").map(Number);
            const timeDate = new Date("2024-01-01T00:00:00");
            timeDate.setHours(hours, minutes);
            const y = timeScale(timeDate);

            return (
              <g key={time}>
                <line
                  x1={0}
                  y1={y}
                  x2={WIDTH}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />
                <text
                  x={-10}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-gray-500"
                  style={{ fontSize: "12px" }}
                >
                  {time}
                </text>
              </g>
            );
          })}

          {/* Meal boxes */}
          {weekData.map((day, dayIndex) => {
            const dayX = dayIndex * (WIDTH / 7) + 10;

            return day.meals.map((meal) => {
              const [hours, minutes] = meal.time.split(":").map(Number);
              const mealTime = new Date("2024-01-01T00:00:00");
              mealTime.setHours(hours, minutes);
              const y = timeScale(mealTime) - MEAL_BOX_HEIGHT / 2;

              const isSelected =
                meal === selectedMeal ||
                meal === comparison.meal1 ||
                meal === comparison.meal2;

              return (
                <MealBox
                  key={`${day.date}-${meal.id}`}
                  meal={meal}
                  x={dayX}
                  y={y}
                  isSelected={isSelected}
                />
              );
            });
          })}
        </g>
      </svg>

      {/* Ingredient Legend */}
      <IngredientLegend
        ingredients={allIngredients}
        colorMap={
          new Map(
            Array.from(allIngredients).map((ing) => [
              ing,
              colorManager.getColor(ing),
            ])
          )
        }
        selectedIngredients={selectedIngredients}
        onIngredientToggle={handleIngredientToggle}
      />

      {/* Popups */}
      {selectedMeal && containerRef.current && (
        <MealDetailPopup
          meal={selectedMeal}
          position={popupPosition}
          containerBounds={containerRef.current.getBoundingClientRect()}
          onClose={() => setSelectedMeal(null)}
          onCompare={handleCompareClick}
          isCompareMode={compareMode}
        />
      )}

      {comparison.meal1 && comparison.meal2 && (
        <MealComparisonPopup
          meal1={comparison.meal1}
          meal2={comparison.meal2}
          onClose={() => {
            setComparison({ meal1: null, meal2: null });
            setCompareMode(false);
          }}
        />
      )}
    </div>
  );
};

// Utility function for debouncing
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default MealCalendarViz;

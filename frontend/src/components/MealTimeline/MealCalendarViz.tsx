import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DayMeals,
  Meal,
  Food,
  Ingredient,
  VisualizationLevel,
  MealRecommendation,
  FilterOptions,
} from "./types";
import { LevelSelector } from "./components/LevelSelector";
import { FilterPanel } from "./components/FilterPanel";
import { MealView } from "./components/MealView";
import { FoodView } from "./components/FoodView";
import { IngredientView } from "./components/IngredientView";
import { PatternInsights } from "./components/PatternInsights";
import { WeekSelector } from "./components/WeekSelector";
import { CollapsiblePanel } from "./components/CollapsiblePanel";
import { MealDetailsPanel } from "./components/MealDetailsPanel";
import { calculateCurrentNutritionalValues } from "./utils/nutritionalUtils";
import { usePatternAnalysis } from "./hooks/usePatternAnalysis";
import { useFilters } from "./hooks/useFilters";

interface MealCalendarVizProps {
  initialData: DayMeals[];
  userPreferences: {
    diabetesFriendly: boolean;
    culturalPreferences: string[];
  };
  managementTips: Array<{
    mealType: string;
    tips: string[];
  }>;
  nutritionalGoals: {
    dailyCalories: number;
    carbohydrates: { min: number; max: number; unit: string };
    protein: { min: number; max: number; unit: string };
    fiber: { daily: number; unit: string };
  };
  onRecommendationSelect?: (recommendation: MealRecommendation) => void;
}

const MealCalendarViz: React.FC<MealCalendarVizProps> = ({
  initialData,
  userPreferences,
  managementTips,
  nutritionalGoals,
  onRecommendationSelect,
}) => {
  // State declarations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekData, setWeekData] = useState<DayMeals[]>(initialData);
  const [currentLevel, setCurrentLevel] =
    useState<VisualizationLevel["type"]>("meal");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<MealRecommendation | null>(null);
  const vizRef = React.useRef<HTMLDivElement>(null);

  // Add state for nutritional values
  const [currentNutritionalValues, setCurrentNutritionalValues] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fiber: 0,
  });

  const [baseNutritionalValues, setBaseNutritionalValues] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fiber: 0,
  });

  const { filters, updateFilters } = useFilters();
  const { patterns } = usePatternAnalysis(weekData);

  const handleFilterChange = (newFilters: FilterOptions) => {
    updateFilters(newFilters);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vizRef.current && !vizRef.current.contains(event.target as Node)) {
        handleRecommendationSelect(null);
        setSelectedMeal(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);
        // Ensure all dates are properly processed
        const processedData = initialData.map((day) => ({
          ...day,
          date: new Date(day.date),
          isEmpty: day.isEmpty || !day.meals || day.meals.length === 0,
        }));
        setWeekData(processedData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Error processing data"
        );
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [initialData]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "[") {
        setShowLeftPanel(false);
      } else if (e.key === "]") {
        setShowLeftPanel(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Update nutritional values when week data changes
  useEffect(() => {
    const values = calculateCurrentNutritionalValues(weekData);
    setCurrentNutritionalValues(values);
    setBaseNutritionalValues(values); // Store base values
  }, [weekData]);

  // Meal selection handler
  const handleMealSelect = (meal: Meal | null) => {
    // If selecting a new meal, reset any active recommendation
    if (meal && meal !== selectedMeal) {
      handleRecommendationSelect(null); // Reset recommendation first
    }
    setSelectedMeal(meal);
  };

  // Handle recommendation selection
  const handleRecommendationSelect = (
    recommendation: MealRecommendation | null
  ) => {
    setSelectedRecommendation(recommendation);

    // Reset to base values if deselecting
    if (!recommendation) {
      setCurrentNutritionalValues(baseNutritionalValues);
      return;
    }

    // Update nutritional values with recommendation impact
    setCurrentNutritionalValues({
      calories:
        baseNutritionalValues.calories +
        recommendation.nutritionalImpact.calories,
      carbs:
        baseNutritionalValues.carbs + recommendation.nutritionalImpact.carbs,
      protein:
        baseNutritionalValues.protein +
        recommendation.nutritionalImpact.protein,
      fiber:
        baseNutritionalValues.fiber + recommendation.nutritionalImpact.fiber,
    });
  };

  // Click handler for the main visualization area
  const handleMainAreaClick = (event: React.MouseEvent) => {
    // Check if click is not on a meal or recommendation
    if (
      (event.target as HTMLElement).closest(".meal-card, .recommendation-card")
    ) {
      return;
    }

    handleRecommendationSelect(null);
    setSelectedMeal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-br from-[#FFF5E9] to-[#FFE6C9]/30"
      ref={vizRef}
    >
      {/* Header/Title Bar */}
      {/* <div className="h-16 bg-white border-b border-gray-200 shadow-sm z-30 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">Meal Calendar</h1>
          <span className="text-sm text-gray-500">
            Plan and Track Your Meals With Ease{" "}
          </span>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="w-full h-full flex overflow-hidden">
        {/* Left Panel Container */}
        <motion.div
          initial={false}
          animate={{ width: showLeftPanel ? 320 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 relative z-20"
        >
          {/* Left Panel Content */}
          <AnimatePresence>
            {showLeftPanel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-[320px] bg-white/80 backdrop-blur-md shadow-lg flex flex-col overflow-hidden border-r border-[#FFE6C9]"
              >
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-6">
                    <CollapsiblePanel
                      title="Filters"
                      subtitle="Customize your meal view"
                    >
                      <FilterPanel
                        filters={filters}
                        userPreferences={userPreferences}
                        onFilterChange={handleFilterChange}
                        weekData={weekData}
                      />
                    </CollapsiblePanel>

                    {/* Pattern Insights Panel */}
                    <CollapsiblePanel
                      title="Pattern Insights"
                      subtitle="Discover your eating patterns"
                    >
                      <PatternInsights
                        patterns={patterns}
                        currentLevel={currentLevel}
                        selectedMeal={selectedMeal}
                        selectedFood={selectedFood}
                        selectedIngredient={selectedIngredient}
                        managementTips={managementTips}
                      />
                    </CollapsiblePanel>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Center Calendar View */}
        <div
          className="flex-1 flex flex-col min-w-0"
          onClick={handleMainAreaClick}
        >
          {/* Level Selector Bar */}
          <div className="w-full h-16 px-4 bg-white/80 backdrop-blur-md border-b border-[#FFE6C9] shadow-sm z-10 flex items-center justify-between">
            {/* Left side group */}
            <div className="flex items-center">
              {/* Toggle Button */}
              <motion.button
                initial={false}
                onClick={() => setShowLeftPanel(!showLeftPanel)}
                className="mr-4 p-1.5 rounded-full hover:bg-[#FFE6C9]/50 transition-colors"
              >
                <svg
                  className={`w-5 h-5 text-[#FF9F1C] transition-transform duration-300 ${
                    !showLeftPanel ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={!showLeftPanel ? "M15 19l-7-7 7-7" : "M15 5l-7 7 7 7"}
                  />
                </svg>
              </motion.button>

              {/* Divider */}
              <div className="h-8 w-px bg-[#FFE6C9]" />

              {/* Level Selector */}
              <div className="ml-4">
                <LevelSelector
                  currentLevel={currentLevel}
                  onLevelChange={setCurrentLevel}
                />
              </div>
            </div>

            {/* Right side - Week Selector */}
            <WeekSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>

          {/* Main Visualization Area */}
          <div className="flex-1 flex overflow-hidden p-4">
            {/* Calendar View */}
            <div className="flex-1 min-w-0">
              <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg h-full overflow-hidden border border-[#FFE6C9]">
                {currentLevel === "meal" && (
                  <MealView
                    weekData={weekData}
                    selectedDate={selectedDate}
                    onMealSelect={handleMealSelect}
                    selectedMeal={selectedMeal}
                    onRecommendationSelect={handleRecommendationSelect}
                    selectedRecommendation={selectedRecommendation}
                  />
                )}
                {currentLevel === "food" && (
                  <FoodView
                    weekData={weekData}
                    onFoodSelect={setSelectedFood}
                    selectedFood={selectedFood}
                  />
                )}
                {currentLevel === "ingredient" && (
                  <IngredientView
                    weekData={weekData}
                    onIngredientSelect={setSelectedIngredient}
                    selectedIngredient={selectedIngredient}
                  />
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-[480px] ml-4 bg-white/80 backdrop-blur-md rounded-xl shadow-lg z-10 flex-shrink-0 border border-[#FFE6C9]">
              <MealDetailsPanel
                meal={selectedMeal}
                recommendation={selectedRecommendation}
                onClose={() => {
                  setSelectedMeal(null);
                  handleRecommendationSelect(null);
                }}
                nutritionalGoals={nutritionalGoals}
                currentNutritionalValues={currentNutritionalValues}
                baseNutritionalValues={baseNutritionalValues}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCalendarViz;

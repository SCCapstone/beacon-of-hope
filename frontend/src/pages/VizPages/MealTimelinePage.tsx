import React, { useState, useEffect } from "react";
import MealCalendarViz from "../../components/viz/PatternExplorer/MealTimeline/MealCalendarViz";
import { DayMeals } from "../../components/viz/PatternExplorer/MealTimeline/types";

export const MealTimelinePage: React.FC = () => {
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchMealData = async () => {
      try {
        setIsLoading(true);
        // Mock data for now
        const sampleData: DayMeals[] = [
          {
            date: "2024-03-18",
            meals: [
              {
                id: "1",
                name: "Breakfast",
                time: "09:00",
                ingredients: [
                  {
                    name: "eggs",
                    amount: 2,
                    unit: "pieces",
                    category: "protein",
                  },
                  { name: "milk", amount: 200, unit: "ml", category: "dairy" },
                  {
                    name: "bread",
                    amount: 2,
                    unit: "slices",
                    category: "carbs",
                  },
                  {
                    name: "spinach",
                    amount: 50,
                    unit: "g",
                    category: "vegetable",
                  },
                ],
              },
              {
                id: "2",
                name: "Lunch",
                time: "13:00",
                ingredients: [
                  {
                    name: "chicken breast",
                    amount: 200,
                    unit: "g",
                    category: "protein",
                  },
                  { name: "rice", amount: 150, unit: "g", category: "carbs" },
                  {
                    name: "spinach",
                    amount: 100,
                    unit: "g",
                    category: "vegetable",
                  },
                  {
                    name: "olive oil",
                    amount: 15,
                    unit: "ml",
                    category: "fats",
                  },
                ],
              },
              {
                id: "3",
                name: "Dinner",
                time: "19:00",
                ingredients: [
                  {
                    name: "salmon",
                    amount: 200,
                    unit: "g",
                    category: "protein",
                  },
                  { name: "rice", amount: 150, unit: "g", category: "carbs" },
                  {
                    name: "broccoli",
                    amount: 100,
                    unit: "g",
                    category: "vegetable",
                  },
                  {
                    name: "olive oil",
                    amount: 15,
                    unit: "ml",
                    category: "fats",
                  },
                ],
              },
            ],
          },
          {
            date: "2024-03-19",
            meals: [
              {
                id: "4",
                name: "Breakfast",
                time: "08:30",
                ingredients: [
                  {
                    name: "oatmeal",
                    amount: 100,
                    unit: "g",
                    category: "carbs",
                  },
                  { name: "milk", amount: 200, unit: "ml", category: "dairy" },
                  {
                    name: "banana",
                    amount: 1,
                    unit: "piece",
                    category: "fruit",
                  },
                  {
                    name: "honey",
                    amount: 20,
                    unit: "g",
                    category: "sweetener",
                  },
                ],
              },
              {
                id: "5",
                name: "Lunch",
                time: "12:30",
                ingredients: [
                  {
                    name: "chicken breast",
                    amount: 200,
                    unit: "g",
                    category: "protein",
                  },
                  {
                    name: "bread",
                    amount: 2,
                    unit: "slices",
                    category: "carbs",
                  },
                  {
                    name: "lettuce",
                    amount: 50,
                    unit: "g",
                    category: "vegetable",
                  },
                  {
                    name: "olive oil",
                    amount: 10,
                    unit: "ml",
                    category: "fats",
                  },
                ],
              },
              {
                id: "6",
                name: "Dinner",
                time: "18:30",
                ingredients: [
                  {
                    name: "eggs",
                    amount: 3,
                    unit: "pieces",
                    category: "protein",
                  },
                  { name: "rice", amount: 150, unit: "g", category: "carbs" },
                  {
                    name: "spinach",
                    amount: 100,
                    unit: "g",
                    category: "vegetable",
                  },
                  {
                    name: "olive oil",
                    amount: 15,
                    unit: "ml",
                    category: "fats",
                  },
                ],
              },
            ],
          },
        ];
        setWeekData(sampleData);
      } catch (err) {
        setError("Failed to load meal data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Meal Timeline
        </h2>
        <p className="text-gray-600">
          Explore your meal patterns and ingredient usage throughout the week
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        <MealCalendarViz weekData={weekData} />
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          Click on any meal to see details. Select two meals to compare their
          ingredients and nutritional content.
        </p>
      </div>
    </div>
  );
};

export default MealTimelinePage;

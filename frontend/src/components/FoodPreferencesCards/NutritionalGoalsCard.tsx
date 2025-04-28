import React from 'react';

interface Props {
  calories: number | undefined;
  carbs: number | undefined;
  protein: number | undefined;
  fiber: number | undefined;
  onGoalChange: (key: "calories" | "carbs" | "protein" | "fiber", value: number) => void;
}

const NutritionalGoalsCard: React.FC<Props> = ({
  calories,
  carbs,
  protein,
  fiber,
  onGoalChange,
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "calories" | "carbs" | "protein" | "fiber"
  ) => {
    const value = parseInt(e.target.value);
    onGoalChange(key, value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Daily Nutritional Goals
      </h2>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label
              htmlFor="calories"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Calories (kcal)
            </label>
            <input
              type="number"
              id="calories"
              value={calories}
              onChange={(e) => handleInputChange(e, "calories")}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended: 2000-2500 kcal/day
            </p>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="carbs"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Carbohydrates (g)
            </label>
            <input
              type="number"
              id="carbs"
              value={carbs}
              onChange={(e) => handleInputChange(e, "carbs")}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended: 225-325 g/day
            </p>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="protein"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Protein (g)
            </label>
            <input
              type="number"
              id="protein"
              value={protein}
              onChange={(e) => handleInputChange(e, "protein")}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended: 50-175 g/day
            </p>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="fiber"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Fiber (g)
            </label>
            <input
              type="number"
              id="fiber"
              value={fiber}
              onChange={(e) => handleInputChange(e, "fiber")}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended: 25-38 g/day
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NutritionalGoalsCard; 
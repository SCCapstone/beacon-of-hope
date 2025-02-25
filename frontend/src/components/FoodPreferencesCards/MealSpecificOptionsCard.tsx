interface Props {
  mealIndex: number;
  totalMeals: number;
  mealName: string;
  mealTime: string;
  mealTypes: {
    mainCourse: boolean;
    side: boolean;
    dessert: boolean;
    beverage: boolean;
  };
  onMealNameChange: (value: string) => void;
  onMealTimeChange: (value: string) => void;
  onMealCheckboxChange: (type: string) => void;
  onPreviousMeal: () => void;
  onNextMeal: () => void;
}

const MealSpecificOptionsCard: React.FC<Props> = ({
  mealIndex,
  totalMeals,
  mealName,
  mealTime,
  mealTypes,
  onMealNameChange,
  onMealTimeChange,
  onMealCheckboxChange,
  onPreviousMeal,
  onNextMeal,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Meal-Specific Options
        </h2>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onPreviousMeal}
            disabled={mealIndex === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-600">
            Meal {mealIndex + 1} of {totalMeals}
          </span>
          <button
            type="button"
            onClick={onNextMeal}
            disabled={mealIndex === totalMeals - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label
              htmlFor="mealName"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Meal Name
            </label>
            <input
              type="text"
              id="mealName"
              value={mealName}
              onChange={(e) => onMealNameChange(e.target.value)}
              placeholder="Enter meal name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="mealTime"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Meal Time
            </label>
            <input
              type="time"
              id="mealTime"
              value={mealTime}
              onChange={(e) => onMealTimeChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(mealTypes).map(([type, checked]) => (
            <label key={type} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onMealCheckboxChange(type)}
                className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
              />
              <span className="text-gray-700">
                {type
                  .replace(/([A-Z])/g, " $1")
                  .trim()
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}{" "}
              </span>
            </label>
          ))}
        </div>
      </form>
    </div>
  );
};

export default MealSpecificOptionsCard;

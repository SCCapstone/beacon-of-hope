interface Props {
  mealPlanLength: number;
  mealsPerDay: number;
  mealPlanName: string;
  handleDropdownChange: (
    value: React.ChangeEvent<HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => void;
  handleMealsPerDayChange: (
    value: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  handleMealPlanNameChange: (value: string) => void;
  setMealPlanLength: React.Dispatch<React.SetStateAction<number>>;
  setMealsPerDay: React.Dispatch<React.SetStateAction<number>>;
}

const MealPlanConfigCard: React.FC<Props> = ({
  mealPlanLength,
  mealsPerDay,
  mealPlanName,
  handleDropdownChange,
  handleMealsPerDayChange,
  handleMealPlanNameChange,
  setMealPlanLength,
  setMealsPerDay,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Meal Plan Configuration
      </h2>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label
              htmlFor="mealPlanLength"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Meal Plan Length (in days)
            </label>
            <select
              id="mealPlanLength"
              value={mealPlanLength}
              onChange={(e) => handleDropdownChange(e, setMealPlanLength)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="mealsPerDay"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Meals per Day
            </label>
            <select
              id="mealsPerDay"
              value={mealsPerDay}
              onChange={handleMealsPerDayChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            >
              <option value={1}>1 meal</option>
              <option value={2}>2 meals</option>
              <option value={3}>3 meals</option>
              <option value={4}>4 meals</option>
              <option value={5}>5 meals</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="mealPlanName"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Meal Plan Name
          </label>
          <input
            type="text"
            id="mealPlanName"
            value={mealPlanName}
            onChange={(e) => handleMealPlanNameChange(e.target.value)}
            placeholder="Enter the Meal Plan Name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
          />
        </div>
      </form>
    </div>
  );
};

export default MealPlanConfigCard;

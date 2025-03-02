import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { parseISO, format, addDays } from 'date-fns';
import { useEffect, useState } from 'react';

interface Props {
  mealPlanLength: number;
  mealsPerDay: number;
  mealPlanName: string;
  mealPlanStartDate: string;
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
  setMealPlanStartDate: React.Dispatch<React.SetStateAction<string>>;
}

const MealPlanConfigCard: React.FC<Props> = ({
  mealPlanLength,
  mealsPerDay,
  mealPlanName,
  mealPlanStartDate,
  handleDropdownChange,
  handleMealsPerDayChange,
  handleMealPlanNameChange,
  setMealPlanLength,
  setMealsPerDay,
  setMealPlanStartDate,
}) => {
  const [mealPlanEndDate, setMealPlanEndDate] = useState<string>("");
  
  // Calculate end date whenever start date or length changes
  useEffect(() => {
    if (mealPlanStartDate) {
      const startDate = parseISO(mealPlanStartDate);
      // Subtract 1 from mealPlanLength because end date is inclusive
      const endDate = addDays(startDate, mealPlanLength - 1); 
      setMealPlanEndDate(format(endDate, "yyyy-MM-dd"));
    } else {
      setMealPlanEndDate("");
    }
  }, [mealPlanStartDate, mealPlanLength]);

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
              Meal Plan Length
            </label>
            <select
              id="mealPlanLength"
              value={mealPlanLength}
              onChange={(e) => handleDropdownChange(e, setMealPlanLength)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
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
              Meals Per Day
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label
              htmlFor="mealPlanStartDate"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Meal Plan Start Date
            </label>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={mealPlanStartDate ? parseISO(mealPlanStartDate) : null}
                onChange={(newValue: any) => {
                  setMealPlanStartDate(
                    newValue ? format(newValue, "yyyy-MM-dd") : ""
                  );
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "Select start date",
                  },
                }}
              />
            </LocalizationProvider>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="mealPlanEndDate"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Meal Plan End Date
            </label>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={mealPlanEndDate ? parseISO(mealPlanEndDate) : null}
                readOnly
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "End date (calculated)",
                    InputProps: {
                      readOnly: true,
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MealPlanConfigCard;

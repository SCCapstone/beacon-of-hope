// MealPlanConfigCard.tsx
import React from "react";

interface Props {
    mealPlanLength: number,
    mealsPerDay: number,
    mealPlanName: string,
    handleDropdownChange: (value: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<number>>) => void,
    handleMealsPerDayChange: (value: React.ChangeEvent<HTMLSelectElement>) => void,
    handleMealPlanNameChange: (value: string) => void
    setMealPlanLength: React.Dispatch<React.SetStateAction<number>>
    setMealsPerDay: React.Dispatch<React.SetStateAction<number>>
};

const MealPlanConfigCard:React.FC<Props> = ({mealPlanLength, mealsPerDay, mealPlanName, handleDropdownChange, handleMealsPerDayChange, handleMealPlanNameChange, setMealPlanLength, setMealsPerDay}) => {
    return (
        <div className="food-pref--card">
            <h2>Meal Plan Configuration</h2>
            <form>
              <div className="form-group">
                <label htmlFor="mealPlanLength">Meal Plan Length (in days):</label>
                <select
                  id="mealPlanLength"
                  value={mealPlanLength}
                  onChange={(e) => handleDropdownChange(e, setMealPlanLength)}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="mealsPerDay">Meals per Day:</label>
                <select
                  id="mealsPerDay"
                  value={mealsPerDay}
                  onChange={(e) => handleMealsPerDayChange(e)}
                >
                  <option value={3}>3 meals</option>
                  <option value={4}>4 meals</option>
                  <option value={5}>5 meals</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="mealPlanName">Meal Plan Name:</label>
                <input
                  type="text"
                  id="mealPlanName"
                  value={mealPlanName}
                  onChange={(e) => {handleMealPlanNameChange(e.target.value)}}
                  placeholder="Enter meal plan name"
                />
              </div>
            </form>
        </div>
    );
};

export default MealPlanConfigCard;
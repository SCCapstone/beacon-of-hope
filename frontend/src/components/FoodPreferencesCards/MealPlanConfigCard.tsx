// MealPlanConfigCard.tsx
import { useState } from "react";

const MealPlanConfigCard: React.FC = () => {

    const [mealPlanLength, setMealPlanLength] = useState<number>(7); // Default to 7 days
    const [mealsPerDay, setMealsPerDay] = useState<number>(3); // Default to 3 meals per day
    const [mealName, setMealName] = useState<string>('');
    const [mealTypes, setMealTypes] = useState({
      mainCourse: false,
      side: false,
      dessert: false,
      beverage: false
    });

    // Handle changes for dropdowns
    const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<number>>) => {
      setter(Number(e.target.value));
    };

    // Handle change for the meal name input
    const handleMealNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMealName(e.target.value);
    };

    // Handle change for the meal type checkboxes
    const handleCheckboxChange = (mealType: string) => {
      setMealTypes((prev) => ({
        ...prev,
        [mealType]: !prev[mealType as keyof typeof prev],
      }));
    };

    return (
        <div className="meal-plan-form">
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
                onChange={(e) => handleDropdownChange(e, setMealsPerDay)}
              >
                <option value={3}>3 meals</option>
                <option value={4}>4 meals</option>
                <option value={5}>5 meals</option>
              </select>
            </div>
        
            <div className="form-group">
              <label htmlFor="mealName">Meal Name:</label>
              <input
                type="text"
                id="mealName"
                value={mealName}
                onChange={handleMealNameChange}
                placeholder="Enter meal name"
              />
            </div>
        
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={mealTypes.mainCourse}
                  onChange={() => handleCheckboxChange('mainCourse')}
                />
                Main Course
              </label>
        
              <label>
                <input
                  type="checkbox"
                  checked={mealTypes.side}
                  onChange={() => handleCheckboxChange('side')}
                />
                Side
              </label>
        
              <label>
                <input
                  type="checkbox"
                  checked={mealTypes.dessert}
                  onChange={() => handleCheckboxChange('dessert')}
                />
                Dessert
              </label>
        
              <label>
                <input
                  type="checkbox"
                  checked={mealTypes.beverage}
                  onChange={() => handleCheckboxChange('beverage')}
                />
                Beverage
              </label>
            </div>
          </form>
        </div>
    );
};

export default MealPlanConfigCard;
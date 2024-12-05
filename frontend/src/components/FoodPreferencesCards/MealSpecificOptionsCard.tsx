// MealSpecificOptionsCard.tsx

interface Props {
    mealName: string,
    mealTime: string,
    mealTypes: {
        main: boolean,
        side: boolean,
        dessert: boolean,
        beverage: boolean
    },
    onMealNameChange: (value: string) => void;
    onMealTimeChange: (value: string) => void;
    onMealCheckboxChange: (type: string) => void;
};

const MealSpecificOptionsCard:React.FC<Props> = ({mealName, mealTime, mealTypes, onMealNameChange, onMealTimeChange, onMealCheckboxChange}) => {



    return (
        <div className="meal-specific-options-card">
      <form>
        <div className="form-group">
          <label htmlFor="mealName">Meal Name</label>
          <input
            type="text"
            id="mealName"
            value={mealName}
            onChange={(e) => onMealNameChange(e.target.value)}
            placeholder="Enter meal name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="mealTime">Meal Time</label>
          <input
            type="time"
            id="mealTime"
            value={mealTime}
            onChange={(e) => onMealTimeChange(e.target.value)}
          />
        </div>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={mealTypes.main}
              onChange={() => onMealCheckboxChange('mainCourse')}
            />
            Main Course
          </label>
          <label>
            <input
              type="checkbox"
              checked={mealTypes.side}
              onChange={() => onMealCheckboxChange('side')}
            />
            Side
          </label>
          <label>
            <input
              type="checkbox"
              checked={mealTypes.dessert}
              onChange={() => onMealCheckboxChange('dessert')}
            />
            Dessert
          </label>
          <label>
            <input
              type="checkbox"
              checked={mealTypes.beverage}
              onChange={() => onMealCheckboxChange('beverage')}
            />
            Beverage
          </label>
        </div>
      </form>
    </div>
  );
};

export default MealSpecificOptionsCard;
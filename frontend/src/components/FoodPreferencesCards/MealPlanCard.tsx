import React from "react";
// import "./MealPlanCard.css";

const MealPlanCard: React.FC = () => {
  return (
    <div className="meal-plan-card">
      <h3>Meal Plan</h3>
      <ul>
        <li>
          <span>Meal Plan Length</span>
          <span>3</span>
          <input type="checkbox" checked readOnly />
        </li>
        <li>
          <span>Meals Per Day</span>
          <span>2</span>
          <input type="checkbox" checked readOnly />
        </li>
        <li>
          <span>Main Course</span>
          <input type="checkbox" checked readOnly />
        </li>
      </ul>
      <button>Edit</button>
    </div>
  );
};

export default MealPlanCard;

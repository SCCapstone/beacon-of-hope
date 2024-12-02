import React from "react";
// import "./FoodPreferencesCard.css";

const FoodPreferencesCard: React.FC = () => {
  return (
    <div className="food-preferences-card">
      <h3>Food Preferences</h3>
      <ul>
        <li>
          <span>Dairy</span>
          <span className="preference-strong">Strongly Preferred</span>
          <input type="checkbox" checked readOnly />
        </li>
        <li>
          <span>Diabetes</span>
          <input type="checkbox" readOnly />
        </li>
        <li>
          <span>Vegan</span>
          <input type="checkbox" readOnly />
        </li>
      </ul>
      <button>Edit</button>
    </div>
  );
};

export default FoodPreferencesCard;

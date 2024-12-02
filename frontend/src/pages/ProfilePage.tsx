import React from "react";
import UserProfileCard from "../components/FoodPreferencesCards/UserProfileCard";
import FoodPreferencesCard from "../components/FoodPreferencesCards/FoodPreferencesCard";
import MealPlanCard from "../components/FoodPreferencesCards/MealPlanCard";
import MealPlanStats from "../components/FoodPreferencesCards/MealPlanStats";
import "./ProfilePage.css";

const ProfilePage: React.FC = () => {
  return (
    <div className="profile-page">
      <UserProfileCard />
      <div className="preferences-and-plans">
        <FoodPreferencesCard />
        <MealPlanCard />
      </div>
      <MealPlanStats />
    </div>
  );
};

export default ProfilePage;

import { Routes, Route, Navigate } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import HomePage from "../pages/HomePage";
import MealPlanPage, { MealTimelinePage } from "../pages/MealTimelinePage";
import FoodPreferencesPage from "../pages/FoodPreferencesPage";
import SettingsPage from "../pages/SettingsPages/SettingsPage";
// import MealTimelinePage from "../pages/VizPages/MealTimelinePage";

const UseRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />}></Route>
      <Route path="/signup" element={<SignUpPage />}></Route>
      <Route path="/login" element={<LoginPage />}></Route>
      <Route path="/home" element={<HomePage />}></Route>
      <Route path="/food-preferences" element={<FoodPreferencesPage />}></Route>
      <Route path="/meal-plan" element={<MealTimelinePage/>}></Route>
      <Route path="/settings" element={<SettingsPage />}></Route>
    </Routes>
  );
};

export default UseRoutes;

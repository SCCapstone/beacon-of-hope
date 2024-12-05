import { Routes, Route, Navigate } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import HomePage from "../pages/HomePage";
import MealPlanPage from "../pages/MealPlanPage";
import FoodPreferencesPage from "../pages/FoodPreferencesPage";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPages/SettingsPage";
import MealTimelinePage from "../pages/VizPages/MealTimelinePage";

const UseRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />}></Route>
      <Route path="/login" element={<LoginPage />}></Route>
      <Route path="/signup" element={<SignUpPage />}></Route>
      <Route path="/welcome" element={<WelcomePage />}></Route>
      <Route path="/food-preferences" element={<FoodPreferencesPage />}></Route>
      <Route path="/meal-plan" element={<MealPlanPage />}></Route>
      <Route path="/profile" element={<ProfilePage />}></Route>
      <Route path="/settings" element={<SettingsPage />}></Route>

      {/* Visualization Routes */}
      <Route path="/insights" element={<Navigate to="/insights/timeline" />} />
      <Route path="/insights/timeline" element={<MealTimelinePage />} />
    </Routes>
  );
};

export default UseRoutes;

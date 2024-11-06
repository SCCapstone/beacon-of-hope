// UseRoutes.tsx
import { Routes, Route } from 'react-router-dom'
import SettingsPage from '../pages/SettingsPage';
import MealPlanPage from '../pages/MealPlanPage';
import FoodPreferencesPage from '../pages/FoodPreferencesPage';
import LoginPage from '../pages/LoginPage';

const UseRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path='/Login' element={<LoginPage />}></Route>
            <Route path='/Settings' element={<SettingsPage />}></Route>
            <Route path='/MealPlan' element={<MealPlanPage />}></Route>
            <Route path='/FoodPreferences' element={<FoodPreferencesPage />}></Route>
        </Routes>
    );
};

export default UseRoutes;
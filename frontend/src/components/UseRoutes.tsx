// UseRoutes.tsx
import { Routes, Route } from 'react-router-dom'
import SettingsPage from '../pages/SettingsPages/SettingsPage';
import MealPlanPage from '../pages/MealPlanPage';
import FoodPreferencesPage from '../pages/FoodPreferencesPage';
import LoginPage from '../pages/LoginPage';
import PersonalInfoPage from '../pages/SettingsPages/PersonalInfoPage';
import LoginSecurityPage from '../pages/SettingsPages/LoginSecurityPage';
import NotificationsPage from '../pages/SettingsPages/NotificationsPage';
import PrivacySharingPage from '../pages/SettingsPages/PrivacySharingPage';

const UseRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path='/login' element={<LoginPage />}></Route>
            <Route path='/settings' element={<SettingsPage />}></Route>
            <Route path='/meal-plan' element={<MealPlanPage />}></Route>
            <Route path='/food-preferences' element={<FoodPreferencesPage />}></Route>
            <Route path='/personal-info' element={<PersonalInfoPage />}></Route>
            <Route path='/login-and-security' element={<LoginSecurityPage />}></Route>
            <Route path='/privacy-and-sharing' element={<PrivacySharingPage />}></Route>
            <Route path='/notifications' element={<NotificationsPage />}></Route>
        </Routes>
    );
};

export default UseRoutes;
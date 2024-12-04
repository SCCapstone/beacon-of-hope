// UseRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

import WelcomePage from '../pages/WelcomePage';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import MealPlanPage from '../pages/MealPlanPage';
import FoodPreferencesPage from '../pages/FoodPreferencesPage';
import ProfilePage from '../pages/ProfilePage';

// Setting Pages
import SettingsPage from '../pages/SettingsPages/SettingsPage';
import PersonalInfoPage from '../pages/SettingsPages/PersonalInfoPage';
import LoginSecurityPage from '../pages/SettingsPages/LoginSecurityPage';
import NotificationsPage from '../pages/SettingsPages/NotificationsPage';
import PrivacySharingPage from '../pages/SettingsPages/PrivacySharingPage';

// Visualization Pages
// import DashboardPage from '../pages/VizPages/DashboardPage';
import MealTimelinePage from '../pages/VizPages/MealTimelinePage';
// import DailySummariesPage from '../pages/VizPages/DailySummariesPage';
// import FlavorNetworkPage from '../pages/VizPages/FlavorNetworkPage';
// import KeyMetricsPage from '../pages/VizPages/KeyMetricsPage';
// import NutrientHarmonyPage from '../pages/VizPages/NutrientalHarmonyPage';

const UseRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path='/welcome' element={<WelcomePage />}></Route>
            <Route path='/login' element={<LoginPage />}></Route>
            <Route path='/' element={<HomePage />}></Route>
            <Route path='/food-preferences' element={<FoodPreferencesPage />}></Route>
            <Route path='/meal-plan' element={<MealPlanPage />}></Route>
            <Route path='/profile' element={<ProfilePage />}></Route>

            {/* Settings Routes */}
            <Route path='/settings' element={<SettingsPage />}></Route>
            <Route path='/personal-info' element={<PersonalInfoPage />}></Route>
            <Route path='/login-and-security' element={<LoginSecurityPage />}></Route>
            <Route path='/notifications' element={<NotificationsPage />}></Route>
            <Route path='/privacy-and-sharing' element={<PrivacySharingPage />}></Route>

            {/* Visualization Routes */}
            <Route path="/insights" element={<Navigate to="/insights/timeline" />} />
            <Route path="/insights/timeline" element={<MealTimelinePage />} />
            {/* <Route path="/insights/metrics" element={<KeyMetricsPage />} /> */}
            {/* <Route path="/insights/daily" element={<DailySummariesPage />} /> */}
            {/* <Route path="/insights/nutrients" element={<NutrientHarmonyPage />} /> */}
            {/* <Route path="/insights/network" element={<FlavorNetworkPage />} /> */}
        </Routes>
    );
};

export default UseRoutes;

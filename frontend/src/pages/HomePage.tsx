import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

// Define a constant for complementary accent color
const ACCENT_COLOR = '#4B91D7';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const userState = useSelector((state: RootState) => (state.user));
    // const user = JSON.parse(localStorage.getItem("user") || "null");
    // console.log(userState.user.first_name);

    return (
        <div className="min-h-screen bg-white p-10">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-semibold text-gray-800">Welcome to Our Meal Planner {userState.user.first_name}</h1>
                <p className="text-base text-gray-600">
                    Helping you make healthy and informed meal decisions
                </p>
            </div>

            {/* Navigation Cards */}
            <div className="flex flex-wrap -mx-4">
                {[
                    { title: 'Food Preferences', text: 'Set your dietary preferences and restrictions.', path: '/food-preferences' },
                    { title: 'Meal Plan', text: 'View and customize your weekly meal.', path: '/meal-plan' },
                    { title: 'Visualization', text: 'Explore your dataset in insightful graphs.', path: '/insights/timeline' },
                    { title: 'Settings', text: 'Manage your account settings.', path: '/settings' },
                ].map(card => (
                    <div
                        key={card.title}
                        onClick={() => navigate(card.path)}
                        style={{ transition: 'background-color 0.3s ease, color 0.3s ease'}}
                        className={`
                            flex-1 m-4 p-6 rounded-lg shadow-md cursor-pointer
                            text-center transform transition transform hover:scale-105
                            bg-main-primary hover:bg-opacity-70
                            hover:text-gray-800`}
                    >
                        <h3 className="text-xl font-semibold" style={{ color: ACCENT_COLOR }}>{card.title}</h3>
                        <p className="text-gray-700 text-sm mt-2">{card.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomePage;

// FoodPreferences.tsx
import UserInfoCard from '../components/FoodPreferencesCards/UserInfoCard';
import DietaryPrefCard from '../components/FoodPreferencesCards/DietaryPrefCard';
import MealPlanConfigCard from '../components/FoodPreferencesCards/MealPlanConfigCard';

const FoodPreferencesPage: React.FC = () => {

    return (
        <div className='' id='food-pref--page'>
            <UserInfoCard />
            <DietaryPrefCard />
            <MealPlanConfigCard />
        </div>
    );
};

export default FoodPreferencesPage;
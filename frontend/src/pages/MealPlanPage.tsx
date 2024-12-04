// MealPlanPage.tsx

import MealPlanCard from "../components/MealPlans/MealPlanCard";

const MealPlanPage: React.FC = () => {
    return (
        <div className="page--content">
            <h1>Meal Plan Page</h1>
            <div>
                <MealPlanCard mealType="Main Course" img="" foodName="Pan-Seared Salmon" desc="460 cal, 30g protein"/>
            </div>
        </div>
    );
};

export default MealPlanPage;
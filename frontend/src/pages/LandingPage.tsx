// LandingPage.tsx
import LandingCard from "../components/LandingCard";

const LandingPage: React.FC = () => {
    return (
        <div className="landing--container">
            <LandingCard 
                id="landing--card--one"
                header="Food Preferences"
                desc="Access your saved preferences to edit them and generate new meal plans."
                to="/food-preferences"
            />
            <LandingCard 
                id="landing--card--two"
                header="Calendar"
                desc="Access your saved meal plans in the calendar view."
                to="/meal-plan"
            />
            <LandingCard 
                id="landing--card--three"
                header="Profile & Account Settings"
                desc="Access your profile information and settings."
                to="/settings"
            />
        </div>
    );
}

export default LandingPage;

// LandingPage.tsx
import LandingCard from "../components/LandingCard";

const LandingPage: React.FC = () => {
    return (
        <div className="flex flex-col w-screen h-screen overflow-y-auto">
            <div className="flex flex-row">
                <div className="flex flex-col justify-center items-center">
                        <h1 className="text-4xl font-bold">Welcome to BEACON of Hope!</h1>
                        <p className="text-sm font-semibold">Start using our context-aware, AI-based, meal generation system right now!</p>
                        <h2 className="mt-20">Check us out on GitHub!</h2>
                        <button className="bg-gradient-to-r from-orange-100 to-pink-900 w-20 rounded-full">
                            <a className="text-white">Github</a>
                        </button>
                </div>
                <div className="flex w-full items-end">
                    <img  className="h-96 content-center" src="../../landing-img.png" />
                </div>
            </div>
            <div className="flex flex-col items-left w-1/2 gap-3 mt-3">
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
        </div>
    );
}

export default LandingPage;

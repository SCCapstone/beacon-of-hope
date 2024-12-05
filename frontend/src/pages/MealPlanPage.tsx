// MealPlanPage.tsx
import { useEffect, useState } from "react";
import MealPlanCard from "../components/MealPlans/MealPlanCard";

interface Meal {
    meals: Array<MealItem>
};

interface MealItem {
    main_course: string,
    beverage: string,
    sideDish: string,
    dessert: string,
    meal_time: string

}

const MealPlanPage: React.FC = () => {

    const mealPlan = JSON.parse(localStorage.getItem('mealPlan') || 'null');

    const [selectedDay, setSelectedDay] = useState<Meal | null>({
        meals: [{
            meal_time: '',
            beverage: '',
            main_course: '',
            sideDish: '',
            dessert: ''
        }],
    });

    const handleDaySelect = (day: object, index: number) => {
        setSelectedDay(mealPlan.days[index]);
    };

    return (
        <div className="page--content" id="meal-plan--page">
            <h1>Meal Plan Page</h1>

            <div id="meal-plan--content">
                <div id="days">
                    <h2>Days of the Week</h2>
                    <ul>
                      {mealPlan.days.map((i: object, index: number) => (
                        <li key={index}>
                          <button onClick={() => handleDaySelect(i, index)}>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}
                          </button>
                        </li>
                      ))}
                    </ul>
                </div>
                <div id="meal-plan--cards">
                    <MealPlanCard mainCourseId={selectedDay!.meals[0].main_course} sideId={selectedDay!.meals[0].sideDish} dessertId={selectedDay!.meals[0].dessert} bevId={selectedDay!.meals[0].beverage} mealTime={selectedDay!.meals[0].meal_time}/>
                </div>
            </div>
        </div>
    );
};

export default MealPlanPage;
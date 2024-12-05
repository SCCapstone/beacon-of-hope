// MealPlanPage.tsx
import { useEffect, useState } from "react";
import MealPlanCard from "../components/MealPlans/MealPlanCard";

interface Meal {
    meals: Array<MealItem>
};

interface MealItem {
    main_course: string,
    beverage: string,
    side_dish: string,
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
            side_dish: '',
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
                                <button
                                    style={{
                                        backgroundColor: '#ffe6c9',
                                        border: '1px solid #ddd',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        margin: '5px',
                                        fontWeight: selectedDay === i ? 'bold' : 'normal',
                                    }}
                                    onClick={() => handleDaySelect(i, index)}
                                    aria-pressed={selectedDay === i}
                                >
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div id="meal-plan--cards">
                    {selectedDay && selectedDay.meals.length > 0 ? (
                        selectedDay.meals.map((meal: any, mealIndex: number) => (
                            <MealPlanCard
                                key={mealIndex}
                                mainCourseId={meal.main_course}
                                sideId={meal.side_dish}
                                dessertId={meal.dessert}
                                bevId={meal.beverage}
                                mealTime={meal.meal_time}
                            />
                        ))
                    ) : (
                        <p style={{ fontStyle: 'italic', color: '#555' }}>Please select a day to view meals.</p>
                    )}
                </div>
            </div>
        </div>
    );

};

export default MealPlanPage;

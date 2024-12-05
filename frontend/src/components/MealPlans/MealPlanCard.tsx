import { useEffect, useState } from "react";
import MealItem from "./MealItem";
import "./MealPlanCard.css";

interface Props {
    mainCourseId: string;
    sideId: string;
    dessertId: string;
    bevId: string;
    mealTime: string;
}

const MealPlanCard: React.FC<Props> = ({ mainCourseId, sideId, dessertId, bevId, mealTime }) => {
    const [mainCourse, setMainCourse] = useState<any>(null);
    const [side, setSide] = useState<any>(null);
    const [bev, setBev] = useState<any>(null);
    const [dessert, setDessert] = useState<any>(null);

    useEffect(() => {
        const fetchData = async (url: string, setState: Function) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`Failed to fetch: ${response.statusText}`);
                    return;
                }
                const data = await response.json();
                setState(data);
            } catch (error) {
                console.error(`Error fetching from ${url}:`, error);
            }
        };

        if (mainCourseId) fetchData(`http://localhost:8000/beacon/get-recipe-info/${mainCourseId}`, setMainCourse);
        if (sideId) fetchData(`http://localhost:8000/beacon/get-recipe-info/${sideId}`, setSide);
        if (dessertId) fetchData(`http://localhost:8000/beacon/get-recipe-info/${dessertId}`, setDessert);
        if (bevId) fetchData(`http://localhost:8000/beacon/get-beverage-info/${bevId}`, setBev);
    }, [mainCourseId, sideId, dessertId, bevId]);

    useEffect(() => {
        console.log("Main Course:", mainCourse);
        console.log("Side:", side);
        console.log("Dessert:", dessert);
        console.log("Beverage:", bev);
    }, [mainCourse, side, dessert, bev]);

    return (
        <div className="meal-plan-card">
            <h2 className="meal-plan-title">Meal Plan</h2>
            <div className="meal-time">
                <strong>Meal Time:</strong> {mealTime}
            </div>
            <div className="meal-items-container">
                {mainCourse && <MealItem item={mainCourse} type="Main Course" />}
                {side && <MealItem item={side} type="Side" />}
                {dessert && <MealItem item={dessert} type="Dessert" />}
                {bev && <MealItem item={bev} type="Beverage" />}
            </div>
        </div>
    );
};

export default MealPlanCard;

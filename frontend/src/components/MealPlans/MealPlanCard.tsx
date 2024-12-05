// MealPlanCard.tsx
import { useEffect, useState } from 'react';
import MealItem from "./MealItem";

interface Props {
    mainCourseId: string,
    sideId: string,
    dessertId: string,
    bevId: string,
    mealTime: string
}

const MealPlanCard: React.FC<Props> = ({ mainCourseId, sideId, dessertId, bevId, mealTime }) => {

    const [mainCourse, setMainCourse] = useState(null);
    const [side, setSide] = useState(null);
    const [bev, setBev] = useState(null);
    const [dessert, setDessert] = useState(null);

    useEffect(() => {
        if(mainCourseId !== undefined) {
            const fetchMainCourse = async () => {
                try {
                    const res = await fetch(`http://localhost:8000/beacon/get-recipe-info/1`);
                    const data = await res.json();
                    setMainCourse(data);
                } catch(err) {
                    console.log(err);
                }
            }
            fetchMainCourse();
        }
        if(sideId !== undefined) {
            const fetchSideCourse = async () => {
                try {
                    const res = await fetch(`http://localhost:8000/beacon/get-recipe-info/50`);
                    const data = await res.json();
                    setSide(data);
                } catch(err) {
                    console.log(err);
                }
            }
            fetchSideCourse();
        }
        if(dessertId !== undefined) {
            const fetchDessert = async () => {
                try {
                    const res = await fetch(`http://localhost:8000/beacon/get-recipe-info/4`);
                    const data = await res.json();
                    setDessert(data);
                } catch(err) {
                    console.log(err);
                }
            }
            fetchDessert();
        }
        if(bevId !== undefined) {
            const fetchBev = async () => {
                try {
                    const res = await fetch(`http://localhost:8000/beacon/get-beverage-info/2`);
                    const data = await res.json();
                    setBev(data);
                } catch(err) {
                    console.log(err);
                }
            }
            fetchBev();
        }
    }, []);

    console.log(mainCourse);

    return (
        <div id='meal--plan'>
            <h2>Meal Plan</h2>
            {mainCourse && <MealItem item={mainCourse} type="Main Coure"/>}
            {side && <MealItem item={side} type="Side"/>}
            {bev && <MealItem item={bev} type="Beverage"/>}
            {dessert && <MealItem item={dessert} type="Dessert"/>}
        </div>
    );
}
    

export default MealPlanCard;
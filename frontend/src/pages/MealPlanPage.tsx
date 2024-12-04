// MealPlanPage.tsx
import { useEffect, useState } from "react";
import MealPlanCard from "../components/MealPlans/MealPlanCard";

interface Meal {
    mealTime: string,
    beverage: string,
    mainCourse: string,
    sideDish: string,
    dessert: string
};

interface Day {
    day: number,
    meals: Meal[],
};

interface MealPlan {
    id: string,
    userId: string,
    name: string,
    start: string,
    end: string,
    days: Day[],
    status: string,
    tags: string[],
    created: string,
    updated: string,
};

const MealPlanPage: React.FC = () => {

    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);

    useEffect(() => {
        const fetchMealPlan = async () => {
            try{
                const res = await fetch('https://');

                if(!res.ok) throw Error("Failed to fetch meal plan data");

                const data: MealPlan = await res.json();

                // const data: MealPlan = {
                //     id: '1',
                //     userId: '1',
                //     name: "Meal Plan 1",
                //     start: "string",
                //     end: "string",
                //     days: [
                //         {
                //             day: 3,
                //             meals: [
                //                 {
                //                     mealTime: "string",
                //                     beverage: "string",
                //                     mainCourse: "string",
                //                     sideDish: "string",
                //                     dessert: "string"
                //                 }
                //             ]
                //         }
                //     ],
                //     status: "string",
                //     tags: ['string'],
                //     created: "string",
                //     updated: "string",
                // }
                
                // Set data
                setMealPlan(data);
            } catch(e) {
                console.log(e);
            }
        }

        fetchMealPlan();

    }, []);

    return (
        <div className="page--content">
            <h1>Meal Plan Page</h1>
            <div>
                <MealPlanCard mealType="Main Course" img="" foodName={mealPlan!.name} desc="460 cal, 30g protein"/>
            </div>
        </div>
    );
};

export default MealPlanPage;
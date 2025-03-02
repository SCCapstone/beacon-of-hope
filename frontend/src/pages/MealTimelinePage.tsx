import React, { useState, useEffect } from "react";
import MealCalendarViz from "../components/MealTimeline/MealCalendarViz";
import {
  DayMeals,
  UserPreferences,
  UserAnthropometrics,
} from "../components/MealTimeline/types";
import {
  sampleData,
  nutritionalGoals,
} from "./sampleData";
import { MainLayout } from "../components/Layouts/MainLayout";

export const MealTimelinePage: React.FC = () => {
  const [weekData, setWeekData] = useState<DayMeals[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    diabetesFriendly: true,
    culturalPreferences: ["african_american"],
    allergies: [],
    dietaryRestrictions: [],
    mealPreferences: {
      breakfast: true,
      lunch: true,
      dinner: true,
      snacks: true,
    },
    foodPreferences: {
      spicyLevel: 2,
      sweetLevel: 1,
      preferredCuisines: ["soul_food", "southern"],
    },
  });

  const [_, setUserAnthropometrics] = useState<UserAnthropometrics>({
    age: 45,
    weight: 180,
    height: 68,
    activityLevel: "moderate",
    healthConditions: ["diabetes_type_2"],
    bloodSugarLevels: {
      fasting: 100,
      postPrandial: 140,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call with sample data
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Set the sample data
        setWeekData(sampleData);
      } catch (error) {
        console.error("Error loading data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while loading data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePreferenceUpdate = (newPreferences: Partial<UserPreferences>) => {
    setUserPreferences((prev) => ({
      ...prev,
      ...newPreferences,
    }));
  };

  const handleAnthropometricsUpdate = (
    newData: Partial<UserAnthropometrics>
  ) => {
    setUserAnthropometrics((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <div className="text-center">
          <p className="text-xl mb-4">Error Loading Data</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // console.log(localStorage.getItem("mealPlan"));
  const mealPlan = JSON.parse(localStorage.getItem("mealPlan") || "{}");

  // const mealPlan = {
  //     _id: "67c3945d890a0c1920acc8b2",
  //     user_id: "67c149e417717376a4ab1dff",
  //     name: "User Meal Plan",
  //     days: {
  //       "2025-03-01": {
  //         _id: "67c3945d890a0c1920acc8ae",
  //         meals: [
  //           {
  //             _id: "67c3945d890a0c1920acc8ac",
  //             meal_time: "8:00am",
  //             meal_name: "breakfast",
  //             meal_types: {
  //               beverage: "6",
  //               main_course: "27",
  //               side_dish: "33",
  //               dessert: "14",
  //             },
  //           },
  //           {
  //             _id: "67c3945d890a0c1920acc8ad",
  //             meal_time: "9:00am",
  //             meal_name: "lunch",
  //             meal_types: { main_course: "38", dessert: "30" },
  //           },
  //         ],
  //         user_id: "67c149e417717376a4ab1dff",
  //         meal_plan_id: "67c3945d890a0c1920acc8b2",
  //       },
  //       "2025-03-02": {
  //         _id: "67c3945d890a0c1920acc8b1",
  //         meals: [
  //           {
  //             _id: "67c3945d890a0c1920acc8af",
  //             meal_time: "8:00am",
  //             meal_name: "breakfast",
  //             meal_types: {
  //               beverage: "10",
  //               main_course: "9",
  //               side_dish: "31",
  //               dessert: "14",
  //             },
  //           },
  //           {
  //             _id: "67c3945d890a0c1920acc8b0",
  //             meal_time: "8:00am",
  //             meal_name: "lunch",
  //             meal_types: { main_course: "34", dessert: "26" },
  //           },
  //         ],
  //         user_id: "67c149e417717376a4ab1dff",
  //         meal_plan_id: "67c3945d890a0c1920acc8b2",
  //       },
  //     },
  //   };

  return (
    <MainLayout
      title="Meal Calendar"
      subtitle="Plan and Track Your Meals With Ease"
    >
      <MealCalendarViz
        initialData={weekData}
        userPreferences={{
          diabetesFriendly: userPreferences.diabetesFriendly,
          culturalPreferences: userPreferences.culturalPreferences,
        }}
        nutritionalGoals={nutritionalGoals}
        mealPlan={mealPlan}
        onRecommendationSelect={(recommendation) => {
          console.log("Selected recommendation:", recommendation);
          // TODO: Handle recommendation selection
        }}
      />
    </MainLayout>
  );
};

export default MealTimelinePage;

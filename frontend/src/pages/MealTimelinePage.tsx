import React, { useState, useEffect } from "react";
import MealCalendarViz from "../components/MealTimeline/MealCalendarViz";
import {
  DayMeals,
  UserPreferences,
  UserAnthropometrics,
} from "../components/MealTimeline/types";
import {
  sampleData,
  diabetesManagementTips,
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
        managementTips={diabetesManagementTips}
        nutritionalGoals={nutritionalGoals}
        // onRecommendationSelect={(recommendation) => {
        //   // Handle recommendation selection
        //   console.log("Selected recommendation:", recommendation);
        // }}
      />
    </MainLayout>
  );
};

export default MealTimelinePage;

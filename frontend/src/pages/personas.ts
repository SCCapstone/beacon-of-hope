export interface Persona {
    name: string;
    userInfo: {
      height: string;
      age: string;
      weight: string;
      gender: string;
    };
    dietaryPreferences: {
      dairy: number; // -1: Dislike, 0: No Preference, 1: Like
      meat: number;  // -1: Dislike, 0: No Preference, 1: Like
      nuts: number;  // -1: Dislike, 0: No Preference, 1: Like
      glutenFree: boolean;
      diabetes: boolean;
      vegetarian: boolean;
      vegan: boolean;
    };
    mealPlanConfig: {
      mealPlanLength: number;
      mealsPerDay: number;
      mealPlanName: string;
      mealPlanStartDate: string; // Add meal plan start date
    };
    mealSpecificOptions: Array<{
      mealName: string;
      mealTime: string;
      mealTypes: {
        mainCourse: boolean;
        side: boolean;
        dessert: boolean;
        beverage: boolean;
      };
    }>;
  }

  export const personas: { [key: string]: Persona } = {
    earlJones: {
      name: "Earl Jones",
      userInfo: {
        height: "5'8\"",
        age: "40",
        weight: "185",
        gender: "Male",
      },
      dietaryPreferences: {
        dairy: 1, // Like
        meat: 1,  // Like
        nuts: 0,  // No Preference
        glutenFree: false,
        diabetes: false,
        vegetarian: false,
        vegan: false,
      },
      mealPlanConfig: {
        mealPlanLength: 7,
        mealsPerDay: 3,
        mealPlanName: "Soul Food Plan",
        mealPlanStartDate: "2025-03-10", // Example start date for Earl
      },
      mealSpecificOptions: [
        {
          mealName: "Breakfast",
          mealTime: "08:00",
          mealTypes: {
            mainCourse: true,
            side: true,
            dessert: false,
            beverage: true,
          },
        },
        {
          mealName: "Lunch",
          mealTime: "12:00",
          mealTypes: {
            mainCourse: true,
            side: true,
            dessert: true,
            beverage: true,
          },
        },
        {
          mealName: "Dinner",
          mealTime: "18:00",
          mealTypes: {
            mainCourse: true,
            side: true,
            dessert: true,
            beverage: true,
          },
        },
      ],
    },
    jessicaSmith: {
      name: "Jessica Smith",
      userInfo: {
        height: "5'6\"",
        age: "21",
        weight: "140",
        gender: "Female",
      },
      dietaryPreferences: {
        dairy: 0, // No Preference
        meat: -1, // Dislike
        nuts: 1,  // Like
        glutenFree: false,
        diabetes: true,
        vegetarian: false,
        vegan: false,
      },
      mealPlanConfig: {
        mealPlanLength: 7,
        mealsPerDay: 3,
        mealPlanName: "Diabetic-Friendly Plan",
        mealPlanStartDate: "2025-03-15" // Corrected syntax
      },
      mealSpecificOptions: [
        {
          mealName: "Breakfast",
          mealTime: "08:00",
          mealTypes: {
            mainCourse: true,
            side: true,
            dessert: false,
            beverage: true,
          },
        },
        {
          mealName: "Lunch",
          mealTime: "12:00",
          mealTypes: {
            mainCourse: true,
            side: true,
            dessert: false,
            beverage: true,
          },
        },
        {
          mealName: "Dinner",
          mealTime: "18:00",
          mealTypes: {
            mainCourse: true,
            side: true,
            dessert: false,
            beverage: true,
          },
        },
      ],
    },
  };

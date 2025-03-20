const currentDate = new Date().toISOString().split('T')[0];

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
      mealPlanLength: 3,
      mealsPerDay: 1,
      mealPlanName: "Soul Food Plan",
      mealPlanStartDate: currentDate, 
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
      mealPlanLength: 1,
      mealsPerDay: 3,
      mealPlanName: "Diabetic-Friendly Plan",
      mealPlanStartDate: currentDate,
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

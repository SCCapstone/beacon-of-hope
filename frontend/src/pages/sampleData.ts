import { DayMeals } from "../components/MealTimeline/types";

// Helper function to create dates for a week
const getDateForThisWeek = (dayOffset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay() + dayOffset); // 0 = Sunday, 1 = Monday, etc.
  return date;
};

export const sampleData: DayMeals[] = [
  {
    date: getDateForThisWeek(4),
    meals: [
      {
        id: "breakfast-sun",
        name: "Healthy Southern Breakfast",
        time: "08:30",
        type: "breakfast",
        foods: [
          {
            id: "grits-bowl",
            name: "Whole Grain Grits Bowl",
            type: "main_course",
            ingredients: [
              {
                id: "whole-grits",
                name: "whole grain grits",
                amount: 45,
                unit: "g",
                category: "carbs",
                nutritionalInfo: {
                  calories: 150,
                  protein: 4,
                  carbs: 31,
                  fat: 1,
                  fiber: 2,
                  glycemicIndex: 55,
                },
                allergens: [],
                culturalOrigin: ["southern"],
                diabetesFriendly: true,
              },
              {
                id: "turkey-sausage",
                name: "turkey sausage",
                amount: 60,
                unit: "g",
                category: "protein",
                nutritionalInfo: {
                  calories: 120,
                  protein: 14,
                  carbs: 1,
                  fat: 7,
                  fiber: 0,
                  glycemicIndex: 0,
                },
                allergens: [],
                culturalOrigin: ["southern"],
                diabetesFriendly: true,
              },
            ],
            nutritionalInfo: {
              calories: 270,
              protein: 18,
              carbs: 32,
              fat: 8,
              fiber: 2,
              glycemicIndex: 55,
            },
            preparationTime: 5,
            cookingTime: 15,
            instructions: [
              "Cook whole grain grits according to package",
              "Add turkey sausage",
              "Season with black pepper",
            ],
            culturalOrigin: ["southern", "african_american"],
            diabetesFriendly: true,
            allergens: [],
          },
        ],
        nutritionalInfo: {
          calories: 270,
          protein: 18,
          carbs: 32,
          fat: 8,
          fiber: 2,
          glycemicIndex: 55,
        },
        diabetesFriendly: true,
      },
      {
        id: "lunch-sun",
        name: "Sunday Soul Food Lunch",
        time: "13:00",
        type: "lunch",
        foods: [
          {
            id: "baked-chicken",
            name: "Herb-Baked Chicken",
            type: "main_course",
            ingredients: [
              {
                id: "chicken",
                name: "chicken breast",
                amount: 170,
                unit: "g",
                category: "protein",
                nutritionalInfo: {
                  calories: 280,
                  protein: 53,
                  carbs: 0,
                  fat: 6,
                  fiber: 0,
                  glycemicIndex: 0,
                },
                allergens: [],
                culturalOrigin: ["soul_food"],
                diabetesFriendly: true,
              },
            ],
            nutritionalInfo: {
              calories: 280,
              protein: 53,
              carbs: 0,
              fat: 6,
              fiber: 0,
              glycemicIndex: 0,
            },
            preparationTime: 15,
            cookingTime: 45,
            instructions: [
              "Season chicken with herbs",
              "Bake at 375°F",
              "Let rest before serving",
            ],
            culturalOrigin: ["soul_food", "african_american"],
            diabetesFriendly: true,
            allergens: [],
          },
        ],
        nutritionalInfo: {
          calories: 280,
          protein: 53,
          carbs: 0,
          fat: 6,
          fiber: 0,
          glycemicIndex: 0,
        },
        diabetesFriendly: true,
      },
      {
        id: "dinner-sun",
        name: "Light Sunday Dinner",
        time: "18:00",
        type: "dinner",
        foods: [
          {
            id: "fish-dinner",
            name: "Baked Fish with Vegetables",
            type: "main_course",
            ingredients: [
              {
                id: "fish",
                name: "tilapia",
                amount: 150,
                unit: "g",
                category: "protein",
                nutritionalInfo: {
                  calories: 180,
                  protein: 35,
                  carbs: 0,
                  fat: 4,
                  fiber: 0,
                  glycemicIndex: 0,
                },
                allergens: ["fish"],
                culturalOrigin: ["soul_food"],
                diabetesFriendly: true,
              },
            ],
            nutritionalInfo: {
              calories: 180,
              protein: 35,
              carbs: 0,
              fat: 4,
              fiber: 0,
              glycemicIndex: 0,
            },
            preparationTime: 10,
            cookingTime: 20,
            instructions: ["Season fish", "Bake until flaky"],
            culturalOrigin: ["soul_food"],
            diabetesFriendly: true,
            allergens: ["fish"],
          },
        ],
        nutritionalInfo: {
          calories: 180,
          protein: 35,
          carbs: 0,
          fat: 4,
          fiber: 0,
          glycemicIndex: 0,
        },
        diabetesFriendly: true,
      },
    ],
  },
  {
    // Tuesday
    date: getDateForThisWeek(5),
    meals: [
      {
        id: "breakfast-mon",
        name: "Quick Protein Breakfast",
        time: "07:30",
        type: "breakfast",
        foods: [
          {
            id: "sweet-potato-hash",
            name: "Sweet Potato and Turkey Hash",
            type: "main_course",
            ingredients: [
              {
                id: "sweet-potato",
                name: "sweet potato",
                amount: 100,
                unit: "g",
                category: "carbs",
                nutritionalInfo: {
                  calories: 90,
                  protein: 2,
                  carbs: 21,
                  fat: 0,
                  fiber: 3,
                  glycemicIndex: 50,
                },
                allergens: [],
                culturalOrigin: ["soul_food"],
                diabetesFriendly: true,
              },
            ],
            nutritionalInfo: {
              calories: 90,
              protein: 2,
              carbs: 21,
              fat: 0,
              fiber: 3,
              glycemicIndex: 50,
            },
            preparationTime: 10,
            cookingTime: 15,
            instructions: [
              "Dice sweet potato",
              "Cook with ground turkey",
              "Season with herbs",
            ],
            culturalOrigin: ["soul_food"],
            diabetesFriendly: true,
            allergens: [],
          },
        ],
        nutritionalInfo: {
          calories: 90,
          protein: 2,
          carbs: 21,
          fat: 0,
          fiber: 3,
          glycemicIndex: 50,
        },
        diabetesFriendly: true,
      },
      {
        id: "lunch-mon",
        name: "Meal Prep Lunch",
        time: "12:30",
        type: "lunch",
        foods: [
          {
            id: "blackened-fish",
            name: "Blackened Catfish",
            type: "main_course",
            ingredients: [
              {
                id: "catfish",
                name: "catfish fillet",
                amount: 150,
                unit: "g",
                category: "protein",
                nutritionalInfo: {
                  calories: 240,
                  protein: 37,
                  carbs: 0,
                  fat: 11,
                  fiber: 0,
                  glycemicIndex: 0,
                },
                allergens: ["fish"],
                culturalOrigin: ["soul_food"],
                diabetesFriendly: true,
              },
            ],
            nutritionalInfo: {
              calories: 270,
              protein: 37,
              carbs: 2,
              fat: 13,
              fiber: 0,
              glycemicIndex: 0,
            },
            preparationTime: 10,
            cookingTime: 15,
            instructions: [
              "Season fish with blackened seasoning",
              "Pan sear until done",
            ],
            culturalOrigin: ["soul_food", "cajun"],
            diabetesFriendly: true,
            allergens: ["fish"],
          },
        ],
        nutritionalInfo: {
          calories: 270,
          protein: 37,
          carbs: 2,
          fat: 13,
          fiber: 0,
          glycemicIndex: 0,
        },
        diabetesFriendly: true,
      },
      // {
      // // TODO: Add dinner for Monday...
      // }
    ],
  },
  {
    date: getDateForThisWeek(6),
    meals: [], // Empty meals array
    isEmpty: true, // Mark as empty
    recommendations: [
      {
        meal: {
          id: "rec-breakfast-wed",
          name: "Healthy Start Breakfast",
          time: "08:00",
          type: "breakfast",
          foods: [
            {
              id: "quinoa-bowl",
              name: "Quinoa Breakfast Bowl",
              type: "main_course",
              ingredients: [
                {
                  id: "quinoa",
                  name: "quinoa",
                  amount: 45,
                  unit: "g",
                  category: "carbs",
                  nutritionalInfo: {
                    calories: 160,
                    protein: 6,
                    carbs: 28,
                    fat: 2.5,
                    fiber: 3,
                    glycemicIndex: 53,
                  },
                  allergens: [],
                  culturalOrigin: ["south_american"],
                  diabetesFriendly: true,
                },
                {
                  id: "sweet-potato",
                  name: "roasted sweet potato",
                  amount: 100,
                  unit: "g",
                  category: "vegetable",
                  nutritionalInfo: {
                    calories: 90,
                    protein: 2,
                    carbs: 21,
                    fat: 0,
                    fiber: 3,
                    glycemicIndex: 50,
                  },
                  allergens: [],
                  culturalOrigin: ["soul_food"],
                  diabetesFriendly: true,
                },
              ],
              nutritionalInfo: {
                calories: 250,
                protein: 8,
                carbs: 49,
                fat: 2.5,
                fiber: 6,
                glycemicIndex: 52,
              },
              preparationTime: 10,
              cookingTime: 20,
              instructions: [
                "Cook quinoa according to package instructions",
                "Roast diced sweet potato with olive oil",
                "Combine and season with cinnamon",
              ],
              culturalOrigin: ["fusion"],
              diabetesFriendly: true,
              allergens: [],
            },
          ],
          nutritionalInfo: {
            calories: 250,
            protein: 8,
            carbs: 49,
            fat: 2.5,
            fiber: 6,
            glycemicIndex: 52,
          },
          diabetesFriendly: true,
        },
        score: 90,
        reasons: [
          "High protein content",
          "Fiber-rich ingredients",
          "Cultural favorites included",
        ],
        nutritionalImpact: {
          calories: 400,
          carbs: 45,
          protein: 25,
          fiber: 8,
        },
        healthBenefits: [
          "Supports blood sugar control",
          "Provides sustained energy",
          "Rich in antioxidants",
        ],
      },
    ],
  },
];

// NOTE:
// Add similar detailed meals for each day of the week
// Make sure to include breakfast, lunch, and dinner for each day
// Vary the times slightly to make it more realistic
// Include different types of foods and cultural elements

// Add diabetes management tips
export const diabetesManagementTips = [
  {
    mealType: "breakfast",
    tips: [
      "Include protein with breakfast to help manage blood sugar",
      "Choose whole grains over refined grains",
      "Monitor portion sizes of carbohydrates",
    ],
  },
  {
    mealType: "lunch",
    tips: [
      "Include plenty of non-starchy vegetables",
      "Choose lean proteins",
      "Watch portion sizes of starches",
    ],
  },
  {
    mealType: "dinner",
    tips: [
      "Eat dinner at a consistent time",
      "Include fiber-rich vegetables",
      "Choose healthy cooking methods (baking, grilling, steaming)",
    ],
  },
];

// Add nutritional goals
export const nutritionalGoals = {
  dailyCalories: 1800,
  carbohydrates: {
    min: 45,
    max: 60,
    unit: "g/meal",
  },
  protein: {
    min: 20,
    max: 30,
    unit: "g/meal",
  },
  fiber: {
    daily: 25,
    unit: "g",
  },
};

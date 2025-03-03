import { useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useNavigate } from "react-router-dom";
import UserInformation from "../components/FoodPreferencesCards/UserInformation";
import DietaryPreferences from "../components/FoodPreferencesCards/DietPreferences";
import MealPlanConfigCard from "../components/FoodPreferencesCards/MealPlanConfigCard";
import MealSpecificOptionsCard from "../components/FoodPreferencesCards/MealSpecificOptionsCard";
import { MainLayout } from "../components/Layouts/MainLayout";
import { personas } from "./personas";


const FoodPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const userState = useSelector((state: RootState) => (state.user));

  // User Info
  const [height, setHeight] = useState<string>(`5'8"`);
  const [age, setAge] = useState<string>("26");
  const [weight, setWeight] = useState<string>("185");
  const [gender, setGender] = useState<string>("Male");

  // Meal Plan Config Card
  const [mealPlanLength, setMealPlanLength] = useState<number>(7);
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [mealPlanName, setMealPlanName] = useState<string>("Your Meal Plan...");
  const [mealPlanStartDate, setMealPlanStartDate] = useState<string>("");

  // Personas
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof personas | null>(null);

  // Dietary Pref Card
  const [dairy, setDairy] = useState<number>(1);
  const [meat, setMeat] = useState<number>(1);
  const [nuts, setNuts] = useState<number>(1);
  const [glutenFree, setGlutenFree] = useState<boolean>(false);
  const [diabetes, setDiabetes] = useState<boolean>(false);
  const [vegetarian, setVegetarian] = useState<boolean>(false);
  const [vegan, setVegan] = useState<boolean>(false);

  // Meal Specific Options
  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  const [mealConfigs, setMealConfigs] = useState<
    Array<{
      mealName: string;
      mealTime: string;
      mealTypes: {
        mainCourse: boolean;
        side: boolean;
        dessert: boolean;
        beverage: boolean;
      };
    }>
  >(() => [
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
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(e.target.value);
  };

  const handleDropdownChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setter(Number(e.target.value));
  };

  // Function for Persona Data
  const applyPersona = (personaKey: keyof typeof personas) => {
    const persona = personas[personaKey];

    setHeight(persona.userInfo.height);
    setAge(persona.userInfo.age);
    setWeight(persona.userInfo.weight);
    setGender(persona.userInfo.gender);

    setDairy(persona.dietaryPreferences.dairy);
    setMeat(persona.dietaryPreferences.meat);
    setNuts(persona.dietaryPreferences.nuts);
    setGlutenFree(persona.dietaryPreferences.glutenFree);
    setDiabetes(persona.dietaryPreferences.diabetes);
    setVegetarian(persona.dietaryPreferences.vegetarian);
    setVegan(persona.dietaryPreferences.vegan);

    // Update Meal Plan Configuration
    setMealPlanLength(persona.mealPlanConfig.mealPlanLength);
    setMealsPerDay(persona.mealPlanConfig.mealsPerDay);
    setMealPlanName(persona.mealPlanConfig.mealPlanName);
    setMealPlanStartDate(persona.mealPlanConfig.mealPlanStartDate);
    setMealConfigs(persona.mealSpecificOptions);
    setSelectedPersona(personaKey);
  };

  const handleMealsPerDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMealsPerDay = Number(e.target.value);
    setMealsPerDay(newMealsPerDay);

    setMealConfigs((prev) => {
      const newConfigs = [...prev];
      if (newMealsPerDay > prev.length) {
        // Add new meal configs
        for (let i = prev.length; i < newMealsPerDay; i++) {
          newConfigs.push({
            mealName: "",
            mealTime: "",
            mealTypes: {
              mainCourse: false,
              side: false,
              dessert: false,
              beverage: false,
            },
          });
        }
      } else if (newMealsPerDay < prev.length) {
        // Remove excess meal configs
        newConfigs.splice(newMealsPerDay);
      }
      return newConfigs;
    });

    // Reset current meal index if it's now out of bounds
    setCurrentMealIndex((prev) =>
      Math.min(prev, Math.max(0, newMealsPerDay - 1))
    );
  };

  const handleMealPlanNameChange = (value: string) => {
    setMealPlanName(value);
  };

  const handleSliderChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => {
    setter(value);
  };

  const handleCheckboxChange = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter((prev) => !prev);
  };

  const handlePreviousMeal = () => {
    setCurrentMealIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextMeal = () => {
    setCurrentMealIndex((prev) => Math.min(mealsPerDay - 1, prev + 1));
  };

  const handleSubmit = async () => {
    console.log("Starting submit process...");

    // Process all meal configs based on mealsPerDay
    const processedMealConfigs = Array.from(
      { length: mealsPerDay },
      (_, index) => ({
        meal_name: mealConfigs[index]?.mealName,
        meal_time: "",
        meal_types: {
          beverage: mealConfigs[index]?.mealTypes.beverage || true,
          main_course: mealConfigs[index]?.mealTypes.mainCourse || true,
          side: mealConfigs[index]?.mealTypes.side || true,
          dessert: mealConfigs[index]?.mealTypes.dessert || true,
        },
      })
    );

    const requestBody = {
      starting_date: mealPlanStartDate,
      meal_plan_config: {
        num_days: mealPlanLength,
        num_meals: mealsPerDay,
        meal_configs: processedMealConfigs,
      },
      user_preferences: {
        dairyPreference:dairy,
        meatPreference: meat,
        nutsPreference: nuts,
      },
      "user_id": userState.user._id
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    };

    try {
      console.log(
        "Sending request to:",
        "http://localhost:8000/beacon/recommendation/bandit"
      );
      const response = await fetch(
        "http://localhost:8000/beacon/recommendation/bandit",
        requestOptions
      );
      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response body:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Successful response:", result);

      localStorage.setItem("mealPlan", JSON.stringify(result));
      navigate("/meal-plan");
    } catch (err) {
      console.error("Detailed error:", err);
      alert("Failed to generate meal plan. Please try again.");
    }
  };

  return (
    <MainLayout
    title="Food Preferences"
    subtitle="Customize Your Dietary Preferences"
  >
    {/* Enable vertical scrolling */}
    <div className="w-screen h-screen overflow-y-auto bg-gray-50">
      {/* Persona Selection Section */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-large text-gray-700">
            Select Our Recommended Personas
          </span>
          <div className="relative group">
            <button
              onClick={() => applyPersona("earlJones")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Earl Jones
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block
                            px-3 py-2 bg-white text-black text-xs rounded shadow-lg inline-block max-w-xs whitespace-normal">
              Earl, a busy African American forklift operator, prefers culturally relevant meals, especially soul food.
            </div>
          </div>
        </div>

        <div className="relative group">
          <button
            onClick={() => applyPersona("jessicaSmith")}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
          >
            Jessica Smith
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block
                          px-3 py-2 bg-white text-black text-xs rounded shadow-lg inline-block max-w-xs whitespace-normal">
            A college student with type 1 diabetes, Jessica needs a meal recommendation system that prioritizes
            low-glycemic, diabetic-friendly meals.
          </div>
        </div>
      </div>

      {/* Content Section with Grid Layout */}
      <div className="px-6 pb-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information Card */}
          <UserInformation
            height={height}
            age={age}
            weight={weight}
            gender={gender}
            handleChange={handleChange}
            setHeight={setHeight}
            setAge={setAge}
            setWeight={setWeight}
            setGender={setGender}
          />

          {/* Dietary Preferences Card */}
          <DietaryPreferences
            dairy={dairy}
            meat={meat}
            nuts={nuts}
            glutenFree={glutenFree}
            diabetes={diabetes}
            vegetarian={vegetarian}
            vegan={vegan}
            handleSliderChange={handleSliderChange}
            handleCheckboxChange={handleCheckboxChange}
            setDairy={setDairy}
            setMeat={setMeat}
            setNuts={setNuts}
            setGlutenFree={setGlutenFree}
            setDiabetes={setDiabetes}
            setVegetarian={setVegetarian}
            setVegan={setVegan}
          />

          {/* Meal Plan Configuration Card */}
          <MealPlanConfigCard
            mealPlanLength={mealPlanLength}
            mealsPerDay={mealsPerDay}
            mealPlanName={mealPlanName}
            mealPlanStartDate={mealPlanStartDate}
            handleDropdownChange={handleDropdownChange}
            handleMealsPerDayChange={handleMealsPerDayChange}
            handleMealPlanNameChange={handleMealPlanNameChange}
            setMealPlanLength={setMealPlanLength}
            setMealsPerDay={setMealsPerDay}
            setMealPlanStartDate={setMealPlanStartDate}
          />

          {/* Meal Specific Options Card */}
          <MealSpecificOptionsCard
            mealIndex={currentMealIndex}
            totalMeals={mealsPerDay}
            mealName={mealConfigs[currentMealIndex].mealName}
            mealTime={mealConfigs[currentMealIndex].mealTime}
            mealTypes={mealConfigs[currentMealIndex].mealTypes}
            onMealNameChange={(value) => {
              setMealConfigs((prev) => {
                const newConfigs = [...prev];
                newConfigs[currentMealIndex] = {
                  ...newConfigs[currentMealIndex],
                  mealName: value,
                };
                return newConfigs;
              });
            }}
            onMealTimeChange={(value) => {
              setMealConfigs((prev) => {
                const newConfigs = [...prev];
                newConfigs[currentMealIndex] = {
                  ...newConfigs[currentMealIndex],
                  mealTime: value,
                };
                return newConfigs;
              });
            }}
            onMealCheckboxChange={(type) => {
              setMealConfigs((prev) => {
                const newConfigs = [...prev];
                newConfigs[currentMealIndex] = {
                  ...newConfigs[currentMealIndex],
                  mealTypes: {
                    ...newConfigs[currentMealIndex].mealTypes,
                    [type]:
                      !newConfigs[currentMealIndex].mealTypes[
                        type as keyof (typeof newConfigs)[typeof currentMealIndex]["mealTypes"]
                      ],
                  },
                };
                return newConfigs;
              });
            }}
            onPreviousMeal={handlePreviousMeal}
            onNextMeal={handleNextMeal}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-6 mb-16 flex justify-center px-6">
        <button
          onClick={handleSubmit}
          className="px-12 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out transform hover:-translate-y-1"
        >
          GENERATE MEAL PLAN
        </button>
      </div>
    </div>
  </MainLayout>




  );
 }

export default FoodPreferencesPage;

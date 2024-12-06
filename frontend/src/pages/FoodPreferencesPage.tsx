import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserInformation from "../components/FoodPreferencesCards/UserInformation";
import DietaryPreferences from "../components/FoodPreferencesCards/DietPreferences";
import MealPlanConfigCard from "../components/FoodPreferencesCards/MealPlanConfigCard";
import MealSpecificOptionsCard from "../components/FoodPreferencesCards/MealSpecificOptionsCard";

const FoodPreferencesPage: React.FC = () => {
  const navigate = useNavigate();

  // User Info
  const [height, setHeight] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [gender, setGender] = useState<string>("");

  // Meal Plan Config Card
  const [mealPlanLength, setMealPlanLength] = useState<number>(7);
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [mealPlanName, setMealPlanName] = useState<string>("");

  // Dietary Pref Card
  const [dairy, setDairy] = useState<number>(1);
  const [meat, setMeat] = useState<number>(1);
  const [vegetables, setVegetables] = useState<number>(1);
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
  >(() => {
    // Initialize with 3 meal configs (default mealsPerDay value)
    return Array(3)
      .fill(null)
      .map(() => ({
        mealName: "",
        mealTime: "",
        mealTypes: {
          mainCourse: false,
          side: false,
          dessert: false,
          beverage: false,
        },
      }));
  });

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

    // Default meal configs for different times of day
    const defaultMealConfigs = [
      { meal_name: "breakfast", meal_time: "08:00" },
      { meal_name: "lunch", meal_time: "12:00" },
      { meal_name: "dinner", meal_time: "18:00" },
    ];

    // Process all meal configs based on mealsPerDay
    const processedMealConfigs = Array.from(
      { length: mealsPerDay },
      (_, index) => ({
        meal_name:
          mealConfigs[index]?.mealName || defaultMealConfigs[index].meal_name,
        meal_time:
          mealConfigs[index]?.mealTime || defaultMealConfigs[index].meal_time,
        meal_types: {
          beverage: mealConfigs[index]?.mealTypes.beverage || true,
          main_course: mealConfigs[index]?.mealTypes.mainCourse || true,
          side: mealConfigs[index]?.mealTypes.side || true,
          dessert: mealConfigs[index]?.mealTypes.dessert || true,
        },
      })
    );

    const requestBody = {
      meal_plan_config: {
        num_days: mealPlanLength,
        num_meals: mealsPerDay,
        meal_configs: processedMealConfigs,
      },
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
        "http://localhost:8000/beacon/recommendation/random"
      );
      const response = await fetch(
        "http://localhost:8000/beacon/recommendation/random",
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          vegetables={vegetables}
          glutenFree={glutenFree}
          diabetes={diabetes}
          vegetarian={vegetarian}
          vegan={vegan}
          handleSliderChange={handleSliderChange}
          handleCheckboxChange={handleCheckboxChange}
          setDairy={setDairy}
          setMeat={setMeat}
          setVegetables={setVegetables}
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
          handleDropdownChange={handleDropdownChange}
          handleMealsPerDayChange={handleMealsPerDayChange}
          handleMealPlanNameChange={handleMealPlanNameChange}
          setMealPlanLength={setMealPlanLength}
          setMealsPerDay={setMealsPerDay}
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

      {/* Generate Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:-translate-y-1"
        >
          GENERATE MEAL PLAN
        </button>
      </div>
    </div>
  );
};

export default FoodPreferencesPage;

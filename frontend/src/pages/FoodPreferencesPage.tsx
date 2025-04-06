import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { useNavigate } from "react-router-dom";
import UserInformation from "../components/FoodPreferencesCards/UserInformation";
import DietaryPreferences from "../components/FoodPreferencesCards/DietPreferences";
import MealPlanConfigCard from "../components/FoodPreferencesCards/MealPlanConfigCard";
import MealSpecificOptionsCard from "../components/FoodPreferencesCards/MealSpecificOptionsCard";
import NutritionalGoalsCard from "../components/FoodPreferencesCards/NutritionalGoalsCard";
import { MainLayout } from "../components/Layouts/MainLayout";
import { personas } from "./personas";
import { motion, AnimatePresence } from "framer-motion";
import { convertTime24to12 } from "../utils/mealPlanTransformer";

const FoodPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const userState = useSelector((state: RootState) => state.user);

  // User Info
  const [height, setHeight] = useState<string>(`5'8"`);
  const [age, setAge] = useState<string>("26");
  const [weight, setWeight] = useState<string>("185");
  const [gender, setGender] = useState<string>("Male");

  // Meal Plan Config Card
  const [mealPlanLength, setMealPlanLength] = useState<number>(1);
  const [mealsPerDay, setMealsPerDay] = useState<number>(1);
  const [mealPlanName, setMealPlanName] = useState<string>("Your Meal Plan...");
  const [mealPlanStartDate, setMealPlanStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Personas
  const [selectedPersona, setSelectedPersona] = useState<
    keyof typeof personas | null
  >(null);

  // Dietary Pref Card
  const [dairy, setDairy] = useState<number>(0);
  const [meat, setMeat] = useState<number>(0);
  const [nuts, setNuts] = useState<number>(0);
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

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add new state variables for nutritional goals
  const [calories, setCalories] = useState<number>(2000);
  const [carbs, setCarbs] = useState<number>(250);
  const [protein, setProtein] = useState<number>(100);
  const [fiber, setFiber] = useState<number>(30);

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

    // Set Nutritional Goals
    setCalories(persona.nutritionalGoals.calories);
    setCarbs(persona.nutritionalGoals.carbs);
    setProtein(persona.nutritionalGoals.protein);
    setFiber(persona.nutritionalGoals.fiber);

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
            mealName: "New Meal",
            mealTime: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
              minute: "numeric",
            }), // Current Time
            mealTypes: {
              mainCourse: true,
              side: true,
              dessert: false,
              beverage: true,
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
    setIsLoading(true);
    setError(null);
    setLoadingStage("Preparing your preferences...");

    // Process all meal configs based on mealsPerDay
    const processedMealConfigs = Array.from(
      { length: mealsPerDay },
      (_, index) => ({
        meal_name: mealConfigs[index]?.mealName,
        meal_time: convertTime24to12(mealConfigs[index]?.mealTime),
        meal_types: {
          beverage: mealConfigs[index]?.mealTypes.beverage || true,
          main_course: mealConfigs[index]?.mealTypes.mainCourse || true,
          side: mealConfigs[index]?.mealTypes.side || true,
          dessert: mealConfigs[index]?.mealTypes.dessert || true,
        },
      })
    );

    const requestBodyBandit = {
      starting_date: mealPlanStartDate,
      meal_plan_config: {
        num_days: mealPlanLength,
        num_meals: mealsPerDay,
        meal_configs: processedMealConfigs,
      },
      user_preferences: {
        dairyPreference: dairy,
        meatPreference: meat,
        nutsPreference: nuts,
      },
      user_id: userState.user?._id,
    };

    const requestBodyNutritionalGoals = {
      daily_goals: {
        calories: calories,
        carbs: carbs,
        protein: protein,
        fiber: fiber,
      },
      user_id: userState.user?._id,
    }

    // console.log("Request body:", JSON.stringify(requestBodyBandit, null, 2));

    const requestOptionsBandit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBodyBandit),
    };

    const requestOptionsNutritionalGoals = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBodyNutritionalGoals),
    };

    try {
      console.log(
        "Sending request to:",
        "http://localhost:8000/beacon/recommendation/bandit"
      );
      console.log("Request body to Bandit:", JSON.stringify(requestBodyBandit, null, 2));
      console.log("Request body to Nutritional Goals:", JSON.stringify(requestBodyNutritionalGoals, null, 2));


      // Simulate different loading stages with timeouts
      setTimeout(() => {
        setLoadingStage("Analyzing dietary needs...");
      }, 1000);

      setTimeout(() => {
        setLoadingStage("Crafting personalized meal options...");
      }, 2500);

      setTimeout(() => {
        setLoadingStage("Finalizing your meal plan...");
      }, 4000);

      const responseNutritionalGoals = await fetch(
        "http://localhost:8000/beacon/user/nutritional-goals",
        requestOptionsNutritionalGoals
      );
      console.log("Response status:", responseNutritionalGoals.status);

      if (!responseNutritionalGoals.ok) {
        const errorText = await responseNutritionalGoals.text();
        console.log("Error response body:", errorText);
        throw new Error(`HTTP error! status: ${responseNutritionalGoals.status}`);
      }

      const responseBandit = await fetch(
        "http://localhost:8000/beacon/recommendation/bandit",
        requestOptionsBandit
      );
      console.log("Bandit Response status:", responseBandit.status);

      if (!responseBandit.ok) {
        const errorText = await responseBandit.text();
        console.log("Error response body:", errorText);
        throw new Error(`HTTP error! status: ${responseBandit.status}`);
      }

      const result = await responseBandit.json();
      console.log("Bandit Response body:", result);

      // Clear Session Cache BEFORE navigating
      try {
        let clearedCount = 0;
        console.log(
          "FoodPreferencesPage: Attempting to clear sessionStorage recommendation caches..."
        );
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("recommendations-")) {
            sessionStorage.removeItem(key);
            // console.log(`FoodPreferencesPage: Cleared sessionStorage cache key: ${key}`); // Can be verbose
            clearedCount++;
          }
        });
        console.log(
          `FoodPreferencesPage: Cleared ${clearedCount} sessionStorage recommendation cache(s).`
        );
      } catch (cacheError) {
        console.error(
          "FoodPreferencesPage: Error clearing sessionStorage:",
          cacheError
        );
      }
      // End Cache Clearing

      // Show success animation
      setLoadingStage("Success! Your meal plan is ready.");
      setShowSuccess(true);

      console.log("Successful response:", result);

      localStorage.setItem("mealPlan", JSON.stringify(result)); // Save the NEW plan

      // Navigate after showing success for a moment
      setTimeout(() => {
        navigate("/meal-plan");
      }, 1500);
    } catch (err) {
      console.error("Detailed error:", err);
      setError("Failed to generate meal plan. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <MainLayout
      title="Food Preferences"
      subtitle="Customize Your Dietary Preferences"
    >
      {/* Enable vertical scrolling */}
      <div className="w-screen h-screen overflow-y-auto bg-gray-50 relative">
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center"
            >
              <motion.div
                className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 20 }}
              >
                {showSuccess ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <motion.svg
                        className="w-10 h-10 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Success!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your meal plan has been created successfully.
                    </p>
                    <motion.div
                      className="h-1 bg-gray-200 w-full rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                    >
                      <motion.div
                        className="h-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5 }}
                      />
                    </motion.div>
                    <p className="text-sm text-gray-500 mt-2">
                      Redirecting to your meal plan...
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
                        <div className="w-16 h-16 border-l-4 border-r-4 border-transparent rounded-full absolute top-0 animate-ping opacity-75"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Creating Your Meal Plan
                    </h3>
                    <p className="text-gray-600 mb-6">{loadingStage}</p>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-orange-500"
                        initial={{ width: "5%" }}
                        animate={{
                          width: loadingStage.includes("Preparing")
                            ? "25%"
                            : loadingStage.includes("Analyzing")
                            ? "50%"
                            : loadingStage.includes("Crafting")
                            ? "75%"
                            : "95%",
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {/* Loading tips */}
                    <div className="mt-6 text-sm text-gray-500 italic">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {diabetes
                          ? "Optimizing for diabetes-friendly meals with lower glycemic index..."
                          : "Balancing nutritional content for your optimal health..."}
                      </motion.p>
                    </div>
                  </>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                    <button
                      onClick={() => setIsLoading(false)}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persona Selection Section */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-large text-gray-700">
              Select Our Recommended Personas
            </span>
            <div className="relative group">
              <button
                onClick={() => applyPersona("earlJones")}
                className={`px-4 py-2 ${
                  selectedPersona === "earlJones"
                    ? "bg-blue-600"
                    : "bg-blue-500"
                }
                           text-white rounded-lg hover:bg-blue-600 transition duration-200`}
              >
                Earl Jones
              </button>
              <div
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block
                              px-3 py-2 bg-white text-black text-xs rounded shadow-lg inline-block max-w-xs whitespace-normal z-10"
              >
                Earl, a busy African American forklift operator, prefers
                culturally relevant meals, especially soul food.
              </div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => applyPersona("jessicaSmith")}
              className={`px-4 py-2 ${
                selectedPersona === "jessicaSmith"
                  ? "bg-green-600"
                  : "bg-green-500"
              }
                         text-white rounded-lg hover:bg-green-600 transition duration-200`}
            >
              Jessica Smith
            </button>
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block
                            px-3 py-2 bg-white text-black text-xs rounded shadow-lg inline-block max-w-xs whitespace-normal z-10"
            >
              A college student with type 1 diabetes, Jessica needs a meal
              recommendation system that prioritizes low-glycemic,
              diabetic-friendly meals.
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

            {/* Nutritional Goals Card */}
            <NutritionalGoalsCard
              calories={calories}
              carbs={carbs}
              protein={protein}
              fiber={fiber}
              setCalories={setCalories}
              setCarbs={setCarbs}
              setProtein={setProtein}
              setFiber={setFiber}
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
        <div className="mt-6 mb-20 flex justify-center px-6">
          <motion.button
            onClick={handleSubmit}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-12 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-400 hover:bg-orange-500"
            }
                      text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out
                      transform hover:-translate-y-1 relative overflow-hidden`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                PROCESSING...
              </span>
            ) : (
              "GENERATE MEAL PLAN"
            )}
          </motion.button>
        </div>
      </div>
    </MainLayout>
  );
};

export default FoodPreferencesPage;

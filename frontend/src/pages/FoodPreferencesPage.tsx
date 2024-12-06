// FoodPreferences.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MealSpecificOptionsCard from '../components/FoodPreferencesCards/MealSpecificOptionsCard';
import MealPlanConfigCard from '../components/FoodPreferencesCards/MealPlanConfigCard';

const FoodPreferencesPage: React.FC = () => {

    const navigate = useNavigate();

    // User Info
    const [height, setHeight] = useState<string>('');
    const [age, setAge] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [gender, setGender] = useState<string>('');

    // Meal Plan Config Card
    const [mealPlanLength, setMealPlanLength] = useState<number>(7); // Default to 7 days
    const [mealsPerDay, setMealsPerDay] = useState<number>(3); // Default to 3 meals per day
    const [mealPlanName, setMealPlanName] = useState<string>('');

    // Dietary Pref Card
    const [dairy, setDairy] = useState<number>(1);  // Default halfway
    const [meat, setMeat] = useState<number>(1);  // Default halfway
    const [vegetables, setVegetables] = useState<number>(1);  // Default halfway
    const [glutenFree, setGlutenFree] = useState<boolean>(false);
    const [diabetes, setDiabetes] = useState<boolean>(false);
    const [vegetarian, setVegetarian] = useState<boolean>(false);
    const [vegan, setVegan] = useState<boolean>(false);

    // Specific Pref Card
    const [mealName, setMealName] = useState<string>('');
    const [mealTime, setMealTime] = useState<string>('');
    const [meal_types, setMealTypes] = useState({
      mainCourse: false,
      side: false,
      dessert: false,
      beverage: false
    });

    
    const [mealConfigs, setMealConfigs] = useState<any[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
      setter(e.target.value);
    };

    // Handle changes for dropdowns
    const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<number>>) => {
      setter(Number(e.target.value));
    };

    useEffect(() => {
      const newMealConfigs = Array(mealsPerDay).fill(null).map(() => ({
        meal_name: '',
        meal_time: '',
        meal_types: {
          main_course: false,
          side: false,
          dessert: false,
          beverage: false,
        },
      }));
  
      setMealConfigs(newMealConfigs);
    }, [mealsPerDay]);

    const handleMealsPerDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMealsPerDay(Number(e.target.value));
    };

    const handleMealChange = (index: number, field: string, value: any) => {
      const updatedMealConfigs = [...mealConfigs];
      updatedMealConfigs[index][field] = value;
      setMealConfigs(updatedMealConfigs);
    };
  
    const handleMealCheckboxChange = (index: number, mealType: string) => {
      const updatedMealConfigs = [...mealConfigs];
      updatedMealConfigs[index].meal_types[mealType] = !updatedMealConfigs[index].meal_types[mealType];
      setMealConfigs(updatedMealConfigs);
    };

    // Handle change for the meal name input
    const handleMealPlanNameChange = (value: string) => {
      setMealPlanName(value);
    };

    // const handleMealNameChange = (value: string) => {
    //   setMealName(value);
    // };

    // const handleMealTimeChange = (value: string) => {
    //   setMealTime(value);
    // }

    const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
    };

    const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter((prev) => !prev);
    };

    // Map slider values to labels
    const sliderLabels = ["Dislike", "Neutral", "Like"];

    // Need to send a post request to the API on the submit
    const handleSubmit = async () => {

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                "meal_plan_config": {
                    "num_days": mealPlanLength,
                    "num_meals": mealsPerDay,
                    "meal_configs": mealConfigs
                },
            })
        };

        try {
            const response = await fetch('http://localhost:8000/beacon/recommendation/random', requestOptions);
            const result = await response.json();
            localStorage.setItem('mealPlan', JSON.stringify(result));
            navigate('/meal-plan');
        } catch(err) {
            console.log(err);
        }
    };

    return (
        <div className='page--content' id='food-pref--page'>
            <div className="food-pref--card" id="food-pref--user-info">
                <h2>User Information</h2>
                <form id="user-info--form">
                    <div className="dropdown-container">
                      <label htmlFor="height">Height</label>
                      <select id="height" value={height} onChange={(e) => handleChange(e, setHeight)}>
                        <option value="">Select Height</option>
                        <option value="5'0">5'0"</option>
                        <option value="5'1">5'1"</option>
                        <option value="5'2">5'2"</option>
                        <option value="5'3">5'3"</option>
                        <option value="5'4">5'4"</option>
                        <option value="5'5">5'5"</option>
                        <option value="5'6">5'6"</option>
                        <option value="5'7">5'7"</option>
                        <option value="5'8">5'8"</option>
                        <option value="5'9">5'9"</option>
                        <option value="5'10">5'10"</option>
                        <option value="5'11">5'11"</option>
                        <option value="6'0">6'0"</option>
                        {/* Add more options as needed */}
                      </select>
                      <p>Enter Your Height in Feet</p>
                    </div>
                    <div className="dropdown-container">
                      <label htmlFor="age">Age</label>
                      <select id="age" value={age} onChange={(e) => handleChange(e, setAge)}>
                        <option value="">Select Age</option>
                        {Array.from({ length: 100 }, (_, index) => (
                          <option key={index} value={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                      <p>Specify Your Age</p>
                    </div>
                    
                    <div className="dropdown-container">
                      <label htmlFor="weight">Weight (kg)</label>
                      <select id="weight" value={weight} onChange={(e) => handleChange(e, setWeight)}>
                        <option value="">Select Weight</option>
                        {Array.from({ length: 200 }, (_, index) => (
                          <option key={index} value={index + 30}>
                            {index + 30} kg
                          </option>
                        ))}
                      </select>
                      <p>Enter Your Weight In Pounds</p>
                    </div>
                    
                    <div className="dropdown-container">
                      <label htmlFor="gender">Gender</label>
                      <select id="gender" value={gender} onChange={(e) => handleChange(e, setGender)}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <p>Specify Your Gender</p>
                    </div>
                </form>
            </div>

            <div className="food-pref--card" id="food-pref--diet-pref">
                <h2>Dietary Preferences</h2>
                <form>
                    <div className="slider-container">
                      <label htmlFor="dairy">Dairy Preference</label>
                      <input
                        type="range"
                        id="dairy"
                        min="0"
                        max="2"
                        step="1"
                        value={dairy}
                        onChange={(e) => handleSliderChange(setDairy, Number(e.target.value))}
                      />
                      <span>{sliderLabels[dairy]}</span>
                    </div>
                    <div className="slider-container">
                      <label htmlFor="meat">Meat Preference</label>
                      <input
                        type="range"
                        id="meat"
                        min="0"
                        max="2"
                        step="1"
                        value={meat}
                        onChange={(e) => handleSliderChange(setMeat, Number(e.target.value))}
                      />
                      <span>{sliderLabels[meat]}</span>
                    </div>
                    <div className="slider-container">
                      <label htmlFor="vegetables">Vegetable Preference</label>
                      <input
                        type="range"
                        id="vegetables"
                        min="0"
                        max="2"
                        step="1"
                        value={vegetables}
                        onChange={(e) => handleSliderChange(setVegetables, Number(e.target.value))}
                      />
                      <span>{sliderLabels[vegetables]}</span>
                    </div>
                    <div className="checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={glutenFree}
                          onChange={() => handleCheckboxChange(setGlutenFree)}
                        />
                        Gluten-Free
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={diabetes}
                          onChange={() => handleCheckboxChange(setDiabetes)}
                        />
                        Diabetes
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={vegetarian}
                          onChange={() => handleCheckboxChange(setVegetarian)}
                        />
                        Vegetarian
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={vegan}
                          onChange={() => handleCheckboxChange(setVegan)}
                        />
                        Vegan
                      </label>
                    </div>
                </form>
            </div>
            <MealPlanConfigCard 
              mealPlanLength={mealPlanLength} mealsPerDay={mealsPerDay} mealPlanName={mealPlanName} handleDropdownChange={handleDropdownChange} handleMealsPerDayChange={handleMealsPerDayChange} handleMealPlanNameChange={handleMealPlanNameChange} setMealPlanLength={setMealPlanLength} setMealsPerDay={setMealsPerDay}
            />
            {mealConfigs.map((mealConfig, index) => (
              <MealSpecificOptionsCard 
                key={index} 
                mealName={mealConfig.meal_mame} 
                mealTime={mealConfig.meal_time} 
                mealTypes={mealConfig.meal_types} 
                onMealNameChange={(value: string) => handleMealChange(index, 'meal_name', value)} 
                onMealTimeChange={(value: string) => handleMealChange(index, 'meal_time', value)} 
                onMealCheckboxChange={(mealType: string) => handleMealCheckboxChange(index, mealType)}
              />
            ))}

            <button onClick={handleSubmit} type='submit' id='submit--button'>GENERATE MEAL</button>
        </div>
    );
};

export default FoodPreferencesPage;
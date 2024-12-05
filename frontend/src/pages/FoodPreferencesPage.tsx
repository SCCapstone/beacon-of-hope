// FoodPreferences.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const [mealTypes, setMealTypes] = useState({
      mainCourse: false,
      side: false,
      dessert: false,
      beverage: false
    });


    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
      setter(e.target.value);
    };

    // Handle changes for dropdowns
    const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<number>>) => {
      setter(Number(e.target.value));
    };

    // Handle change for the meal name input
    const handleMealPlanNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMealPlanName(e.target.value);
    };

    const handleMealNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMealName(e.target.value);
    };

    // Handle change for the meal type checkboxes
    const handleMealCheckboxChange = (mealType: string) => {
      setMealTypes((prev) => ({
        ...prev,
        [mealType]: !prev[mealType as keyof typeof prev],
      }));
    };

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
                    "meal_configs": [
                        {
                            "meal_name": mealName,
                            "meal_time": mealTime,
                            "beverage": mealTypes.beverage,
                            "main_course": mealTypes.mainCourse,
                            "side": mealTypes.side,
                            "dessert": mealTypes.dessert
                        }
                    ]
                },
            })
        };

        try {
            const response = await fetch('http://localhost:8000/beacon/recommendation/random/', requestOptions);
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

            <div className="food-pref--card">
                <h2>Meal Plan Configuration</h2>
                <form>
                  <div className="form-group">
                    <label htmlFor="mealPlanLength">Meal Plan Length (in days):</label>
                    <select
                      id="mealPlanLength"
                      value={mealPlanLength}
                      onChange={(e) => handleDropdownChange(e, setMealPlanLength)}
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mealsPerDay">Meals per Day:</label>
                    <select
                      id="mealsPerDay"
                      value={mealsPerDay}
                      onChange={(e) => handleDropdownChange(e, setMealsPerDay)}
                    >
                      <option value={3}>3 meals</option>
                      <option value={4}>4 meals</option>
                      <option value={5}>5 meals</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mealPlanName">Meal Plan Name:</label>
                    <input
                      type="text"
                      id="mealPlanName"
                      value={mealPlanName}
                      onChange={handleMealPlanNameChange}
                      placeholder="Enter meal plan name"
                    />
                  </div>
                </form>
            </div>

            <div className="food-pref--card">
              <h3>Meal Specific Options</h3>
              <form id='meal-spec--form'>
                <div className="form-group">
                  <label htmlFor="mealName">Meal Name</label>
                  <input
                    type="text"
                    id="mealName"
                    value={mealName}
                    onChange={handleMealNameChange}
                    placeholder="Enter meal plan name"
                  />
                </div>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={mealTypes.mainCourse}
                      onChange={() => handleMealCheckboxChange('mainCourse')}
                    />
                    Main Course
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={mealTypes.side}
                      onChange={() => handleMealCheckboxChange('side')}
                    />
                    Side
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={mealTypes.dessert}
                      onChange={() => handleMealCheckboxChange('dessert')}
                    />
                    Dessert
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={mealTypes.beverage}
                      onChange={() => handleMealCheckboxChange('beverage')}
                    />
                    Beverage
                  </label>
                </div>
              </form>
            </div>

            <button onClick={handleSubmit
            } type='submit' id='submit--button'>GENERATE MEAL</button>
            <button onClick={() => {navigate('/meal-plan')}}></button>
        </div>
    );
};

export default FoodPreferencesPage;
// DietaryPrefCard.tsx
import { useState } from "react";

const DietaryPrefCard: React.FC = () => {

    const [dairy, setDairy] = useState<number>(1);  // Default halfway
    const [meat, setMeat] = useState<number>(1);  // Default halfway
    const [vegetables, setVegetables] = useState<number>(1);  // Default halfway
    const [glutenFree, setGlutenFree] = useState<boolean>(false);
    const [diabetes, setDiabetes] = useState<boolean>(false);
    const [vegetarian, setVegetarian] = useState<boolean>(false);
    const [vegan, setVegan] = useState<boolean>(false);

    const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
    };

    const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter((prev) => !prev);
    };

    // Map slider values to labels
    const sliderLabels = ["Dislike", "Neutral", "Like"];

    return (
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
    );
};

export default DietaryPrefCard;
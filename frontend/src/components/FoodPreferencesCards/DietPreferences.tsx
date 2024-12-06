import React, { useState } from 'react';
import './css/CardStyles.css';

const DietPreferences: React.FC = () => {
    const [dairy, setDairy] = useState<number>(0);
    const [meat, setMeat] = useState<number>(0);
    const [vegetables, setVegetables] = useState<number>(0);
    const [glutenFree, setGlutenFree] = useState<boolean>(false);
    const [diabetes, setDiabetes] = useState<boolean>(false);
    const [vegetarian, setVegetarian] = useState<boolean>(false);
    const [vegan, setVegan] = useState<boolean>(false);

    const sliderLabels = ["Dislike", "Neutral", "Like"];

    const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
    };

    const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter((prev) => !prev);
    };

    return (
        <div className="card">
            <h2 className="card-title">Dietary Preferences</h2>
            <form className="card-form">
                <div className="slider-container">
                    <label htmlFor="dairy">Dairy Preference</label>
                    <input
                        type="range"
                        id="dairy"
                        min="-1"
                        max="1"
                        step="1"
                        value={dairy}
                        onChange={(e) => handleSliderChange(setDairy, Number(e.target.value))}
                    />
                    <span>{sliderLabels[dairy + 1]}</span>
                </div>
                <div className="slider-container">
                    <label htmlFor="meat">Meat Preference</label>
                    <input
                        type="range"
                        id="meat"
                        min="-1"
                        max="1"
                        step="1"
                        value={meat}
                        onChange={(e) => handleSliderChange(setMeat, Number(e.target.value))}
                    />
                    <span>{sliderLabels[meat + 1]}</span>
                </div>
                <div className="slider-container">
                    <label htmlFor="vegetables">Vegetable Preference</label>
                    <input
                        type="range"
                        id="vegetables"
                        min="-1"
                        max="1"
                        step="1"
                        value={vegetables}
                        onChange={(e) => handleSliderChange(setVegetables, Number(e.target.value))}
                    />
                    <span>{sliderLabels[vegetables + 1]}</span>
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

export default DietPreferences;

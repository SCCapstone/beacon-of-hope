const DietaryPreferences: React.FC<{
  dairy: number;
  meat: number;
  nuts: number;
  glutenFree: boolean;
  diabetes: boolean;
  vegetarian: boolean;
  vegan: boolean;
  handleSliderChange: (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => void;
  handleCheckboxChange: (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => void;
  setDairy: React.Dispatch<React.SetStateAction<number>>;
  setMeat: React.Dispatch<React.SetStateAction<number>>;
  setNuts: React.Dispatch<React.SetStateAction<number>>;
  setGlutenFree: React.Dispatch<React.SetStateAction<boolean>>;
  setDiabetes: React.Dispatch<React.SetStateAction<boolean>>;
  setVegetarian: React.Dispatch<React.SetStateAction<boolean>>;
  setVegan: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  dairy,
  meat,
  nuts,
  glutenFree,
  diabetes,
  vegetarian,
  vegan,
  handleSliderChange,
  handleCheckboxChange,
  setDairy,
  setMeat,
  setNuts,
  setGlutenFree,
  setDiabetes,
  setVegetarian,
  setVegan,
}) => {
  const sliderLabels = ["Dislike", "No Preference", "Like"];

  return (
    <div className="bg-white/10 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Dietary Preferences & Health
      </h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Dairy Preference
            </label>
            <input
              type="range"
              min="-1"
              max="1"
              value={dairy}
              onChange={(e) =>
                handleSliderChange(setDairy, Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-400"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              {sliderLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Meat Preference
            </label>
            <input
              type="range"
              min="0"
              max="2"
              value={meat}
              onChange={(e) =>
                handleSliderChange(setMeat, Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-400"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              {sliderLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Nut Preference
            </label>
            <input
              type="range"
              min="0"
              max="2"
              value={nuts}
              onChange={(e) =>
                handleSliderChange(setNuts, Number(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-400"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              {sliderLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={glutenFree}
              onChange={() => handleCheckboxChange(setGlutenFree)}
              className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
            />
            <span className="text-gray-700">Gluten-Free</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={diabetes}
              onChange={() => handleCheckboxChange(setDiabetes)}
              className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
            />
            <span className="text-gray-700">Diabetes</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={vegetarian}
              onChange={() => handleCheckboxChange(setVegetarian)}
              className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
            />
            <span className="text-gray-700">Vegetarian</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={vegan}
              onChange={() => handleCheckboxChange(setVegan)}
              className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
            />
            <span className="text-gray-700">Vegan</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DietaryPreferences;

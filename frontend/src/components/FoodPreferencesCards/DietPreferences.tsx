import { Tooltip } from "react-tooltip";

const DietaryPreferences: React.FC<{
  dairy: number;
  meat: number;
  nuts: number;
  // glutenFree: boolean;
  // diabetes: boolean;
  // vegetarian: boolean;
  // vegan: boolean;
  selectedCondition: string | null;
  setSelectedCondition: (condition: string) => void;
  handleSliderChange: (key: "dairyPreference" | "meatPreference" | "nutsPreference", value: number) => void;
  handleCheckboxChange: (key: "gluten_free" | "diabetes" | "vegetarian" | "vegan") => void;
}> = ({
  dairy,
  meat,
  nuts,
  // glutenFree,
  // diabetes,
  // vegetarian,
  // vegan,
  selectedCondition,
  setSelectedCondition,
  handleSliderChange,
  handleCheckboxChange
}) => {
  const sliderLabels = ["Dislike", "No Preference", "Like"];

  return (
    <div className="bg-white/10 rounded-2xl shadow-lg p-6">
      <h2 className="flex text-2xl font-semibold text-gray-800 mb-6">
        Dietary Preferences & Health
        <div className="ml-2 text-sm">
            <button
              data-tooltip-id="dietary-disclaimer-tooltip"
              data-tooltip-content="Our recommendation system currently supports only one dietary condition at a time. Selecting a new one will replace the previous selection."
              className="bg-orange-100 text-orange-700 rounded-full p-2 shadow-lg hover:bg-orange-200"
              type="button"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
              </svg>
            </button>
            <Tooltip
              id="dietary-disclaimer-tooltip"
              delayShow={150}
              delayHide={50}
              className="z-50 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
              place="left"
            />
      </div>
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
              onChange={(e) => handleSliderChange("dairyPreference", Number(e.target.value))
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
              min="-1"
              max="1"
              value={meat}
              onChange={(e) => handleSliderChange("meatPreference", Number(e.target.value))}
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
              min="-1"
              max="1"
              value={nuts}
              onChange={(e) => handleSliderChange("nutsPreference", Number(e.target.value))}
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
              checked={selectedCondition == "gluten_free"}
              onChange={() => setSelectedCondition("gluten_free")}
              className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
            />
            <span className="text-gray-700">Gluten-Free</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedCondition == "diabetes"}
              onChange={() => setSelectedCondition("diabetes")}
              className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
            />
            <span className="text-gray-700">Diabetes</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedCondition == "vegetarian"}
              onChange={() => setSelectedCondition("vegetarian")}
              className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-200"
            />
            <span className="text-gray-700">Vegetarian</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedCondition == "vegan"}
              onChange={() => setSelectedCondition("vegan")}
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

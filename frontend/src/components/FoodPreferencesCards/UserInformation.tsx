const UserInformation: React.FC<{
  height: string;
  age: number;
  weight: string;
  gender: string;
  handleChange: (key: "height" | "age" | "weight" | "gender", value: string | number) => void;
}> = ({
  height,
  age,
  weight,
  gender,
  handleChange
}) => {

  // Parse current height into feet and inches
  const [feet, inches] = height.split("'").map(val => parseInt(val));

  // Handle height changes
  const handleHeightChange = (feet: number, inches: number) => {
    handleChange("height", `${feet}'${inches}"`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        User Information
      </h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label
            htmlFor="height"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Height
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <select
                id="height-feet"
                value={feet || ""}
                onChange={(e) => handleHeightChange(parseInt(e.target.value), inches || 0)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              >
                {Array.from({ length: 4 }, (_, i) => i + 4).map((foot) => (
                  <option key={foot} value={foot}>
                    {foot} ft
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                id="height-inches"
                value={inches || ""}
                onChange={(e) => handleHeightChange(feet || 0, parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              >
                {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                  <option key={inch} value={inch}>
                    {inch} in
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter Your Height (ft/in)
          </p>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="age"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Age
          </label>
          <select
            id="age"
            value={age}
            onChange={(e) => handleChange("age", Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
          >
            <option value="">Select Age</option>
            {Array.from({ length: 100 }, (_, index) => (
              <option key={index} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">Specify Your Age</p>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="weight"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Weight
          </label>
          <select
            id="weight"
            value={weight}
            onChange={(e) => handleChange("weight", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
          >
            <option value="">Select Weight</option>
            {Array.from({ length: 300 }, (_, index) => (
              <option key={index} value={index + 1}>
                {index + 1} lbs
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Enter Your Weight in Pounds
          </p>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="gender"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Gender
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Specify Your Gender</p>
        </div>
      </form>
    </div>
  );
};

export default UserInformation;

// UserInformationCard.tsx
import { useState } from "react";

const UserInfoCard: React.FC = () => {

    const [height, setHeight] = useState<string>('');
    const [age, setAge] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [gender, setGender] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        setter(e.target.value);
    };

    return (
        <div className="food-pref--card" id="food-pref--user-info">
            <h2>User Information</h2>
            <form>
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
    );
};

export default UserInfoCard;
import React, { useState } from 'react';
import './css/CardStyles.css';

const UserInformation: React.FC = () => {
    const [height, setHeight] = useState<string>('');
    const [age, setAge] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [gender, setGender] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        setter(e.target.value);
    };

    return (
        <div className="card">
            <h2 className="card-title">User Information</h2>
            <form className="card-form">
                <div className="dropdown-container">
                    <label htmlFor="height">Height</label>
                    <select id="height" value={height} onChange={(e) => handleChange(e, setHeight)}>
                        <option value="">Select Height</option>
                        {/* Height options */}
                    </select>
                    <span>Enter Your Height in Feet</span>
                </div>
                <div className="dropdown-container">
                    <label htmlFor="age">Age</label>
                    <select id="age" value={age} onChange={(e) => handleChange(e, setAge)}>
                        <option value="">Select Age</option>
                        {/* Age options */}
                    </select>
                    <span>Specify Your Age</span>
                </div>
                <div className="dropdown-container">
                    <label htmlFor="weight">Weight (lbs)</label>
                    <select id="weight" value={weight} onChange={(e) => handleChange(e, setWeight)}>
                        <option value="">Select Weight</option>
                        {/* Weight options */}
                    </select>
                    <span>Enter Your Weight in Pounds</span>
                </div>
                <div className="dropdown-container">
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" value={gender} onChange={(e) => handleChange(e, setGender)}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <span>Specify Your Gender</span>
                </div>
            </form>
        </div>
    );
};

export default UserInformation;

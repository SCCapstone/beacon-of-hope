// PersonalInfoPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface PersonalInfo {
    legalName: string,
    email: string,
    password: string
}

const PersonalInfoPage: React.FC = () => {

    const navigate = useNavigate();

    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        legalName: 'John Doe',
        email: 'johndoe@example.com',
        password: '',
      });
    
      // State for tracking edit mode
      const [editMode, setEditMode] = useState<{ [key in keyof PersonalInfo]: boolean }>({
        legalName: false,
        email: false,
        password: false,
      });
    
      // State for managing the edited values
      const [editedValues, setEditedValues] = useState<PersonalInfo>({
        legalName: personalInfo.legalName,
        email: personalInfo.email,
        password: personalInfo.password,
      });
    
      // Handle change in input fields
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PersonalInfo) => {
        const value = e.target.value;
        setEditedValues({
          ...editedValues,
          [field]: value,
        });
      };
    
      // Toggle edit mode
      const toggleEditMode = (field: keyof PersonalInfo) => {
        setEditMode({
          ...editMode,
          [field]: !editMode[field],
        });
      };
    
      // Save updated value for the field
      const handleSave = (field: keyof PersonalInfo) => {
        setPersonalInfo({
          ...personalInfo,
          [field]: editedValues[field],
        });
        toggleEditMode(field); // Exit edit mode after saving
      };

    return (
        <div className="page--content" id="personal-info--page">
            <div className="setting-item">
        <label>Legal Name:</label>
        {editMode.legalName ? (
          <div>
            <input
              type="text"
              value={editedValues.legalName}
              onChange={(e) => handleInputChange(e, 'legalName')}
            />
            <button onClick={() => handleSave('legalName')}>Save</button>
          </div>
        ) : (
          <div>
            <span>{personalInfo.legalName}</span>
            <button onClick={() => toggleEditMode('legalName')}>Edit</button>
          </div>
        )}
      </div>

      <div className="setting-item">
        <label>Email:</label>
        {editMode.email ? (
          <div>
            <input
              type="email"
              value={editedValues.email}
              onChange={(e) => handleInputChange(e, 'email')}
            />
            <button onClick={() => handleSave('email')}>Save</button>
          </div>
        ) : (
          <div>
            <span>{personalInfo.email}</span>
            <button onClick={() => toggleEditMode('email')}>Edit</button>
          </div>
        )}
      </div>

      <div className="setting-item">
        <label>Password:</label>
        {editMode.password ? (
          <div>
            <input
              type="password"
              value={editedValues.password}
              onChange={(e) => handleInputChange(e, 'password')}
            />
            <button onClick={() => handleSave('password')}>Save</button>
          </div>
        ) : (
          <div>
            <span>******</span>
            <button onClick={() => toggleEditMode('password')}>Edit</button>
          </div>
        )}
      </div>
            <button onClick={() => navigate(-1)}>{"< Go Back"}</button>
        </div>
    );
};

export default PersonalInfoPage;
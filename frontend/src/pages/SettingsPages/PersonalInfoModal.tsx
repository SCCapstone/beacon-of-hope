import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { updateUser } from "../../features/userSlice.ts";
import "./css/SettingsModals.css";

interface PersonalInfo {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  allowPersonalization: boolean;
  demographicsInfo: {
    ethnicity: string;
    race: string;
    height: string;
    weight: string;
    age: number;
    gender: string;
  };
  dietaryRestrictions: string;
  dietary_preferences: {
    preferences: string[];
    numerical_preferences: {
      dairy: number;
      nuts: number;
      meat: number;
    };
  };
  health_info: {
    allergies: string[];
    conditions: string[];
  };
}

const PersonalInfoModal: React.FC = () => {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.user.user);
  const isGuest = !userData?._id; // Check if user is a guest by looking for _id

  const [info, setInfo] = useState<PersonalInfo>({
    name: userData?.first_name + " " + userData?.last_name || "Guest User",
    first_name: userData?.first_name || "Guest",
    last_name: userData?.last_name || "User",
    email: userData?.email || "guest@example.com",
    allowPersonalization: userData?.allowPersonalization ?? false,
    demographicsInfo: userData?.demographicsInfo || {
      ethnicity: userData?.demographicsInfo.ethnicity || "",
      race: userData?.demographicsInfo.race || "",
      height: "",
      weight: "",
      age: 0,
      gender: ""
    },
    dietaryRestrictions: userData?.dietaryRestrictions || "",
    dietary_preferences: userData?.dietary_preferences || {
      preferences: [],
      numerical_preferences: {
        dairy: 0,
        nuts: 0,
        meat: 0
      }
    },
    health_info: userData?.health_info || {
      allergies: [],
      conditions: []
    }
  });

  const [editing, setEditing] = useState<keyof PersonalInfo | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfo, string>>>({});

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut Allergy",
    "Shellfish Allergy",
    "Low-Carb",
    "Kosher",
    "Halal",
  ];

  const validateField = (field: keyof PersonalInfo, value: string | number | boolean) => {
    const newErrors: Partial<Record<keyof PersonalInfo, string>> = {};

    switch (field) {
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
          newErrors.email = "Please enter a valid email address";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (field: keyof PersonalInfo, value: string | number | boolean) => {
    if (validateField(field, value)) {
      setInfo((prev) => {
        const updatedUser = { ...prev, [field]: value };
        dispatch(updateUser({ [field]: value }) as any);
        return updatedUser;
      });
      setEditing(null);
    }
  };

  // const handleDemographicsChange = (field: 'ethnicity' | 'race', value: string) => {

  //   console.log(value);
  //   if (!isGuest) {
  //     setInfo((prev) => ({
  //       ...prev,
  //       demographicsInfo: {
  //         ...prev.demographicsInfo,
  //         [field]: value
  //       }
  //     }));
      
  //     // Update the backend
  //     dispatch(updateUser({
  //       demographicsInfo: {
  //         ...info.demographicsInfo,
  //         [field]: value
  //       }
  //     }));
  //   }
  // };

  const renderField = (
    field: keyof PersonalInfo,
    label: string,
    type: string = "text"
  ) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="field-content">
        {editing === field && !isGuest ? (
          <div className="edit-mode">
            <input
              type={type}
              value={info[field] as string}
              onChange={(e) =>
                setInfo((prev) => ({ ...prev, [field]: e.target.value }))
              }
              className={`form-input ${errors[field] ? "error" : ""}`}
            />
            {errors[field] && (
              <span className="error-message">{errors[field]}</span>
            )}
            <div className="edit-actions">
              <button
                className="btn-save"
                onClick={() => handleSave(field, info[field])}
              >
                Save
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setEditing(null);
                  setErrors({});
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="display-mode">
            <span>{String(info[field])}</span>
            {!isGuest && (
              <button className="btn-edit" onClick={() => setEditing(field)}>
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="modal-content">
      <div className="info-description">
        {isGuest ? (
          <p>You are currently using the application as a guest. Create an account to save your preferences and personalize your experience.</p>
        ) : (
          <p>Manage your personal information and preferences to help us provide you with a better experience.</p>
        )}
      </div>

      <div className="info-section">
        <br />
        <h2>
          <b>Basic Information</b>
        </h2>
        {renderField("name", "Full Name")}
        {renderField("email", "Email")}

        <div className="form-group disabled">
          <label className="form-label">Address</label>
          <div className="field-content disabled">
            <span className="coming-soon">Coming soon</span>
          </div>
        </div>
      </div>

      {/* <div className="info-section">
        <h2>
          <b>Demographics & Preferences</b>
        </h2>
        <div className="form-group">
          <label className="form-label">Ethnicity</label>
          <select
            value={info.demographicsInfo.ethnicity}
            onChange={(e) => handleDemographicsChange('ethnicity', e.target.value)}
            className={`form-select ${isGuest ? 'disabled' : ''}`}
            disabled={isGuest}
          >
            <option value="">Prefer not to say</option>
            <option value="hispanic">Hispanic/Latino</option>
            <option value="not_hispanic">Not Hispanic/Latino</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Race</label>
          <select
            value={info.demographicsInfo.race}
            onChange={(e) => handleDemographicsChange('race', e.target.value)}
            className={`form-select ${isGuest ? 'disabled' : ''}`}
            disabled={isGuest}
          >
            <option value="">Prefer not to say</option>
            <option value="white">White</option>
            <option value="black">Black or African American</option>
            <option value="native_american">Native American</option>
            <option value="asian">Asian</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div> */}

      <p className="info-note">
        {isGuest ? (
          <span>Create an account to save your preferences and get personalized meal recommendations.</span>
        ) : (
          <span>Your information helps us provide personalized meal recommendations and improve your experience.</span>
        )}
      </p>
    </div>
  );
};

export default PersonalInfoModal;

import React, { useState } from "react";
import "./css/SettingsModals.css";

interface PersonalInfo {
  name: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  ethnicity: string;
  dietaryRestrictions: string[];
  allowPersonalization: boolean;
}

const PersonalInfoModal: React.FC = () => {
  const [info, setInfo] = useState<PersonalInfo>({
    name: "John Smith",
    dateOfBirth: "1990-01-01",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    ethnicity: "",
    dietaryRestrictions: [],
    allowPersonalization: true,
  });

  const [editing, setEditing] = useState<keyof PersonalInfo | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PersonalInfo, string>>
  >({});

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

  const validateField = (field: keyof PersonalInfo, value: any) => {
    const newErrors: Partial<Record<keyof PersonalInfo, string>> = {};

    switch (field) {
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!/^\+?[\d\s-()]+$/.test(value)) {
          newErrors.phone = "Please enter a valid phone number";
        }
        break;
      case "dateOfBirth":
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          newErrors.dateOfBirth = "Please enter a valid date";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (field: keyof PersonalInfo, value: any) => {
    if (validateField(field, value)) {
      setInfo((prev) => ({ ...prev, [field]: value }));
      setEditing(null);
    }
  };

  const renderField = (
    field: keyof PersonalInfo,
    label: string,
    type: string = "text"
  ) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="field-content">
        {editing === field ? (
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
            <span>{info[field]}</span>
            <button className="btn-edit" onClick={() => setEditing(field)}>
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="modal-content">
      <div className="info-description">
        Manage your personal information and preferences to help us provide you
        with a better experience.
      </div>

      <div className="info-section">
        <br />
        <h2>
          <b>Basic Information</b>
        </h2>
        {renderField("name", "Full Name")}
        {renderField("dateOfBirth", "Date of Birth", "date")}
        {renderField("email", "Email")}
        {renderField("phone", "Phone Number", "tel")}

        <div className="form-group disabled">
          <label className="form-label">Address</label>
          <div className="field-content disabled">
            <span className="coming-soon">Coming soon</span>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h2>
          <b>Demographics & Preferences</b>
        </h2>
        <div className="form-group">
          <label className="form-label">Ethnicity</label>
          <select
            value={info.ethnicity}
            onChange={(e) =>
              setInfo((prev) => ({ ...prev, ethnicity: e.target.value }))
            }
            className="form-select"
          >
            <option value="">Prefer not to say</option>
            <option value="hispanic">Hispanic/Latino</option>
            <option value="hispanic">Not Hispanic/Latino</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Race</label>
          <select
            value={info.ethnicity}
            onChange={(e) =>
              setInfo((prev) => ({ ...prev, ethnicity: e.target.value }))
            }
            className="form-select"
          >
            <option value="">Prefer not to say</option>
            <option value="white">White</option>
            <option value="black">Black or African American</option>
            <option value="black">Native American</option>
            <option value="asian">Asian</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <p className="info-note">
        Your information helps us provide personalized meal recommendations and
        improve your experience.
      </p>
    </div>
  );
};

export default PersonalInfoModal;

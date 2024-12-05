import React, { useState } from "react";
import "./css/SettingsModals.css";

const PrivacySharingModal: React.FC = () => {
  const [consent, setConsent] = useState({
    mealPersonalization: true,
    healthData: false,
    demographicData: true,
  });

  return (
    <div className="modal-content">
      <div className="privacy-section">
        <h3>Data Usage Consent</h3>
        <div className="consent-options">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={consent.mealPersonalization}
              onChange={(e) =>
                setConsent((prev) => ({
                  ...prev,
                  mealPersonalization: e.target.checked,
                }))
              }
            />
            Allow meal plan personalization based on food preferences
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={consent.healthData}
              onChange={(e) =>
                setConsent((prev) => ({
                  ...prev,
                  healthData: e.target.checked,
                }))
              }
            />
            Use my health-related data for better recommendations
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={consent.demographicData}
              onChange={(e) =>
                setConsent((prev) => ({
                  ...prev,
                  demographicData: e.target.checked,
                }))
              }
            />
            Use demographic information for personalization
          </label>
        </div>
      </div>

      <div className="privacy-section disabled">
        <h3>Third-Party Services</h3>
        <p className="coming-soon">Data sharing settings coming soon</p>
      </div>

      <div className="privacy-section disabled">
        <h3>Your Data</h3>
        <div className="data-actions">
          <button className="btn-secondary" disabled>
            Download My Data
          </button>
          <button className="btn-secondary" disabled>
            Update My Data
          </button>
          <button className="btn-secondary" disabled>
            Delete My Data
          </button>
        </div>
        <p className="coming-soon">Data management features coming soon</p>
      </div>

      <div className="privacy-section disabled">
        <h3>Privacy Concerns</h3>
        <button className="btn-secondary" disabled>
          Report a Privacy Concern
        </button>
        <p className="coming-soon">Reporting system coming soon</p>
      </div>

      <div className="privacy-info">
        <h4>How We Handle Your Data</h4>
        <p>
          We take your privacy seriously and are committed to protecting your
          personal information. Learn more about how we collect, use, and
          protect your data in our
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default PrivacySharingModal;

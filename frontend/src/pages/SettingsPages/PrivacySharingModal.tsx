import React, { useState } from "react";
import "./css/SettingsModals.css";

const PrivacySharingModal: React.FC = () => {
  const [consent, setConsent] = useState({
    mealPersonalization: true,
    healthData: false,
    demographicData: true,
  });
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handlePrivacyPolicyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPrivacyPolicy(true);
  };

  if (showPrivacyPolicy) {
    return (
      <div className="modal-content">
        <div className="privacy-section">
          <h3>Privacy Policy</h3>
          <div className="terms-section">
            <section className="terms-intro">
              <p>
                Welcome to BEACON of Hope ("we," "our," or "us"). This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.
              </p>
            </section>

            <section className="terms-part">
              <h1>INFORMATION WE COLLECT</h1>
              <ul>
                <li>Personal Information: Name, email, and demographic data you provide</li>
                <li>Health Information: Dietary restrictions, allergies, and health conditions</li>
                <li>Usage Data: How you interact with our meal recommendations</li>
                <li>Preferences: Food preferences and meal plan customization settings</li>
              </ul>
            </section>

            <section className="terms-part">
              <h1>HOW WE USE YOUR INFORMATION</h1>
              <ul>
                <li>To provide personalized meal recommendations</li>
                <li>To improve our services and user experience</li>
                <li>To communicate with you about your account and updates</li>
                <li>To ensure the security and integrity of our platform</li>
              </ul>
            </section>

            <section className="terms-part">
              <h1>DATA PROTECTION</h1>
              <p>
                We implement appropriate security measures to protect your personal information. Your data is stored securely and accessed only by authorized personnel.
              </p>
            </section>

            <section className="terms-part">
              <h1>YOUR RIGHTS</h1>
              <ul>
                <li>Access your personal data</li>
                <li>Request corrections to your data</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of certain data processing activities</li>
              </ul>
            </section>

            <section className="terms-part">
              <h1>CONTACT US</h1>
              <p>
                If you have any questions about this Privacy Policy, please contact us at beaconOfHope@gmail.com.
              </p>
            </section>

            <section className="terms-foot">
              <p>Last Updated: 02/25/2025</p>
              <button 
                className="btn-secondary" 
                onClick={() => setShowPrivacyPolicy(false)}
                style={{ marginTop: '1rem' }}
              >
                Back to Privacy Settings
              </button>
            </section>
          </div>
        </div>
      </div>
    );
  }

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
          protect your data in our{" "}
          <a href="#" onClick={handlePrivacyPolicyClick}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default PrivacySharingModal;

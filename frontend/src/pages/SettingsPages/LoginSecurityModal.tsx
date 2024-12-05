import React, { useState } from "react";
import "./css/SettingsModals.css";

const LoginSecurityModal: React.FC = () => {
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const calculatePasswordStrength = (
    password: string
  ): { score: number; feedback: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const feedback = ["Very weak", "Weak", "Fair", "Good", "Strong"][score];

    return { score, feedback };
  };

  const handlePasswordChange = (
    field: keyof typeof password,
    value: string
  ) => {
    setPassword((prev) => ({ ...prev, [field]: value }));
    validatePassword(field, value);
  };

  const validatePassword = (field: string, value: string) => {
    const newErrors: Record<string, string> = {};

    if (field === "new") {
      if (value.length < 8) {
        newErrors.new = "Password must be at least 8 characters long";
      }
    }

    if (field === "confirm" && value !== password.new) {
      newErrors.confirm = "Passwords do not match";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add password update logic here
  };

  const strength = calculatePasswordStrength(password.new);

  return (
    <div className="modal-content">
      <div className="security-section">
        <h2>
          <b>Change Password</b>
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              value={password.current}
              onChange={(e) => handlePasswordChange("current", e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              value={password.new}
              onChange={(e) => handlePasswordChange("new", e.target.value)}
              className="form-input"
            />
            {password.new && (
              <div className="password-strength">
                <div className="strength-bar">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`strength-segment ${
                        i < strength.score ? "active" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="strength-text">{strength.feedback}</span>
              </div>
            )}
            {errors.new && <span className="error-message">{errors.new}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              value={password.confirm}
              onChange={(e) => handlePasswordChange("confirm", e.target.value)}
              className="form-input"
            />
            {errors.confirm && (
              <span className="error-message">{errors.confirm}</span>
            )}
          </div>

          <button type="submit" className="btn-primary">
            Update Password
          </button>
        </form>
      </div>

      <div className="security-section disabled">
        <h3>Two-Factor Authentication</h3>
        <p className="section-description">
          Add an extra layer of security to your account.
        </p>
        <button className="btn-secondary" disabled>
          Set up 2FA (Coming Soon)
        </button>
      </div>

      <div className="security-section danger-zone">
        <h3>Account Deactivation</h3>
        {!showDeleteConfirm ? (
          <div>
            <p className="section-description">
              Permanently delete your account and all associated data.
            </p>
            <button
              className="btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div className="delete-confirmation">
            <p>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="confirmation-actions">
              <button
                className="btn-danger"
                onClick={() => {
                  /* Add delete account logic */
                }}
              >
                Yes, Delete My Account
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="security-tips">
        <h4>Security Tips</h4>
        <ul>
          <li>Use a unique password that you don't use for other accounts</li>
          <li>Include a mix of letters, numbers, and symbols</li>
          <li>Avoid using personal information in your password</li>
          <li>Change your password regularly</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginSecurityModal;

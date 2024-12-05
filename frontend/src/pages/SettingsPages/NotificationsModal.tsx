import React from "react";
import "./css/SettingsModals.css";

const NotificationsModal: React.FC = () => {
  return (
    <div className="modal-content">
      <div className="notifications-section">
        <h3>Current Notification Settings</h3>
        <p className="section-description">
          Choose how you'd like to receive updates from us.
        </p>

        <div className="notification-channels disabled">
          <h4>Notification Channels</h4>
          <div className="channel-options">
            <label className="toggle-label disabled">
              <input type="checkbox" disabled />
              Email Notifications
            </label>
            <label className="toggle-label disabled">
              <input type="checkbox" disabled />
              SMS Notifications
            </label>
            <label className="toggle-label disabled">
              <input type="checkbox" disabled />
              In-App Notifications
            </label>
          </div>
          <p className="coming-soon">Notification channels coming soon</p>
        </div>

        <div className="notification-categories disabled">
          <h4>Notification Categories</h4>
          <div className="category-options">
            <label className="toggle-label disabled">
              <input type="checkbox" disabled />
              Meal Plan Updates
            </label>
            <label className="toggle-label disabled">
              <input type="checkbox" disabled />
              Health Tips & Recommendations
            </label>
            <label className="toggle-label disabled">
              <input type="checkbox" disabled />
              Community Updates
            </label>
          </div>
          <p className="coming-soon">Notification categories coming soon</p>
        </div>

        <div className="notification-frequency disabled">
          <h4>Notification Frequency</h4>
          <select className="form-select" disabled>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <p className="coming-soon">Frequency settings coming soon</p>
        </div>

        <div className="notification-preview disabled">
          <h4>Notification Preview</h4>
          <div className="preview-container">
            <p className="coming-soon">Notification preview coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;

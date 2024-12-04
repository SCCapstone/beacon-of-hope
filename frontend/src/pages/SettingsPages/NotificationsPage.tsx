import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationToggle from "../../components/NotificationToggle";

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();

    // State for each notification type
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [inAppNotifications, setInAppNotifications] = useState(true);

    const handleSave = () => {
        // Simulate saving preferences
        alert("Notification preferences saved successfully!");
        navigate(-1); // Navigate back
    };

    return (
        <div className="page--content" id="notifications--page">
            <h1 className="page--header">Notification Preferences</h1>
            <p>Manage how you receive notifications from us.</p>

            <div className="notification-settings">
                <NotificationToggle
                    label="Email Notifications"
                    description="Receive emails for promotions and updates."
                    checked={emailNotifications}
                    onToggle={setEmailNotifications}
                />
                <NotificationToggle
                    label="Push Notifications"
                    description="Get notified on your mobile or desktop."
                    checked={pushNotifications}
                    onToggle={setPushNotifications}
                />
                <NotificationToggle
                    label="SMS Notifications"
                    description="Receive SMS for urgent updates."
                    checked={smsNotifications}
                    onToggle={setSmsNotifications}
                />
                <NotificationToggle
                    label="In-App Notifications"
                    description="Notifications visible within the app."
                    checked={inAppNotifications}
                    onToggle={setInAppNotifications}
                />
            </div>

            <button className="btn-save" onClick={handleSave}>
                Save Preferences
            </button>
            <button className="btn-back" onClick={() => navigate(-1)}>
                {"< Go Back"}
            </button>
        </div>
    );
};

export default NotificationsPage;

import React from "react";

interface NotificationToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onToggle: (checked: boolean) => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ label, description, checked, onToggle }) => {
    return (
        <div className="notification-toggle">
            <div>
                <h4>{label}</h4>
                {description && <p>{description}</p>}
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(e.target.checked)}
                className="toggle-switch"
            />
        </div>
    );
};

export default NotificationToggle;

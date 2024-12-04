// SettingsPage.tsx
import React from "react";
import SettingsCard from "../../components/SettingsCard";

const SettingsPage: React.FC = () => {
    return (
        <div className="page--content" id="settings--page">
            <h1 className="page--header">Account Settings</h1>
            <div>
                <SettingsCard name={"Personal Info"} desc={"Provide personal details and how we can reach you"} img={""} to={"personal-info"}/>
                <SettingsCard name={"Login & Security"} desc={"Update your password and secure your account"} img={""} to={"login-and-security"}/>
                <SettingsCard name={"Privacy & Sharing"} desc={"Manage your personal data, connected services, and data sharing settings"} img={""} to={"privacy-and-sharing"}/>
                <SettingsCard name={"Notifications"} desc={"Choose notification preferences and how you want to be contacted"} img={""} to={"notifications"}/>
            </div>
            <div>
                <h3>Need to deactivate your account?</h3>
                <a href=""><p>Take care of that now</p></a>
            </div>
        </div>
    )
};

export default SettingsPage;
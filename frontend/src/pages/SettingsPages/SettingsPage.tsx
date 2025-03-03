import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import PersonalInfoModal from "./PersonalInfoModal";
import LoginSecurityModal from "./LoginSecurityModal";
import PrivacySharingModal from "./PrivacySharingModal";
import NotificationsModal from "./NotificationsModal";
import "./css/Settings.css";
import { MainLayout } from "../../components/Layouts/MainLayout";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <MainLayout title="Settings" subtitle="Manage Your Account Settings">
      <div className="settings-container">
        <h1 className="settings-header">Account Settings</h1>
        <div className="settings-grid">
          {[
            {
              icon: "👤",
              title: "Personal Info",
              description: "Provide personal details and how we can reach you",
              onClick: () => setActiveModal("personal-info"),
            },
            {
              icon: "🔒",
              title: "Login & Security",
              description: "Update your password and secure your account",
              onClick: () => setActiveModal("login-security"),
            },
            {
              icon: "🔐",
              title: "Privacy & Sharing",
              description: "Manage your personal data and sharing settings",
              onClick: () => setActiveModal("privacy"),
            },
            {
              icon: "🔔",
              title: "Notifications",
              description: "Choose notification preferences",
              onClick: () => setActiveModal("notifications"),
            },
          ].map(({ icon, title, description, onClick }, index) => (
            <div key={index} className="settings-card" onClick={onClick}>
              <span className="settings-card__icon">{icon}</span>
              <div className="settings-card__content">
                <h3 className="settings-card__title">{title}</h3>
                <p className="settings-card__description">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="settings-footer">
          <p>Need to change your Meal Plan Preferences?</p>
          <button
            onClick={() => navigate("/food-preferences")}
            className="settings-footer__link"
          >
            Take care of that now
          </button>
        </div>

        {/* Modals */}
        <Modal
          isOpen={activeModal === "personal-info"}
          onClose={() => setActiveModal(null)}
          title="Personal Information"
          maxWidth="650px"
        >
          <PersonalInfoModal />
        </Modal>

        <Modal
          isOpen={activeModal === "login-security"}
          onClose={() => setActiveModal(null)}
          title="Login & Security"
          maxWidth="650px"
        >
          <LoginSecurityModal />
        </Modal>

        <Modal
          isOpen={activeModal === "privacy"}
          onClose={() => setActiveModal(null)}
          title="Privacy & Sharing"
          maxWidth="650px"
        >
          <PrivacySharingModal />
        </Modal>

        <Modal
          isOpen={activeModal === "notifications"}
          onClose={() => setActiveModal(null)}
          title="Notifications"
          maxWidth="650px"
        >
          <NotificationsModal />
        </Modal>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;

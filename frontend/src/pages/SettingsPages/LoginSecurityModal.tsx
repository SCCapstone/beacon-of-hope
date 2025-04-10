import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import "./css/SettingsModals.css";

const LoginSecurityModal: React.FC = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const navigate = useNavigate();
  const userData = useSelector((state: RootState) => state.user.user);
  const userId = userData?._id || sessionStorage.getItem("user_id") || "";

  // Delete Account Feature
  const handleDeleteAccount = async () => {
    if (!userId) {
      setDeleteError("User not authenticated. Please log in again.");
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/beacon/user/delete/${userId}`, {
        method: "DELETE",
      });
      if (response.status === 204) {
        alert("Your account has been deleted successfully.");
        navigate("/"); // Redirect to homepage after deletion
      } else {
        let data = {} as { Error?: string };
        try {
          data = await response.json();
        } catch (err) {
          console.error("Error parsing JSON:", err);
        }
        setDeleteError(data.Error || 'An error occurred.');
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("An error occurred while deleting your account.");
    }
  };

  return (
    <div className="modal-content">
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
            {deleteError && (
              <p className="error-message">{deleteError}</p>
            )}
            <div className="confirmation-actions">
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
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
        <h4>Deleting Account can NOT be undone</h4>
        <ul>
          <li>This action can not be undone</li>
          <li>Make sure you want to delete your account</li>
          <li>All data associated with your account will be lost</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginSecurityModal;

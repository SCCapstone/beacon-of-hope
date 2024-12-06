import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call logout service if needed (e.g., to invalidate tokens on the server)
        await AuthService.logout();
      } catch (error) {
        console.error("Error during logout:", error);
      }

      // Clear user session (e.g., localStorage or cookies)
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");

      // Redirect to login or home page
      navigate("/login");
    };

    performLogout();
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <h1>Logging out...</h1>
    </div>
  );
};

export default Logout;

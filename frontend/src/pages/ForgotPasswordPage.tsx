import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import "../styles/Login.css";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");

  const navigate = useNavigate();

  const handleRequestQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await AuthService.requestSecurityQuestion(email);
      setSecurityQuestion(res.security_question);
      setStep("verify");
    } catch {
      setError("Email not found or error requesting security question.");
    }
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await AuthService.verifySecurityAnswer(email, securityAnswer);
      if (res.success) {
        setStep("reset");
      } else {
        setError("Incorrect answer. Please try again.");
      }
    } catch {
      setError("Error verifying security answer.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await AuthService.resetPassword(email, newPassword);
      if (res.success) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch {
      setError("Error resetting password.");
    }
  };

  return (
    <div id="login--page">
      <img id="login--left" src="../../login-img.png" alt="Forgot Password" />
      <div id="login--right">
        <div id="login--header">
          <h1 style={{ fontWeight: "700", fontSize: "2.1vw", margin: "0px", color: "#525252" }}>
            Forgot Password
          </h1>
          <p style={{ fontWeight: "400", fontSize: ".8vw", lineHeight: "1.1vw", color: "#525252" }}>
            Recover your account securely
          </p>
        </div>

        <div id="login--content">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          {step === "request" && (
            <form onSubmit={handleRequestQuestion}>
              <div className="login--input">
                <label htmlFor="email" style={{ fontWeight: "600", fontSize: ".82vw", color: "#828282" }}>
                  Enter your email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="mail@abc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="bg-gradient-to-r from-orange-100 to-pink-900" type="submit" id="login--submit">
                Next
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyAnswer}>
              <div className="login--input">
                <label style={{ fontWeight: "600", fontSize: ".82vw", color: "#828282" }}>
                  {securityQuestion}
                </label>
                <input
                  type="text"
                  placeholder="Answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                />
              </div>
              <button className="bg-gradient-to-r from-orange-100 to-pink-900" type="submit" id="login--submit">
                Verify Answer
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword}>
              <div className="login--input">
                <label htmlFor="newPassword" style={{ fontWeight: "600", fontSize: ".82vw", color: "#828282" }}>
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="***********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button className="bg-gradient-to-r from-orange-100 to-pink-900" type="submit" id="login--submit">
                Reset Password
              </button>
            </form>
          )}

          <div style={{ marginTop: "2.5%", textAlign: "center" }}>
            <p
              style={{ fontWeight: "400", fontSize: ".7vw", color: "#7f265b", cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              ← Back to Login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AuthService from "../services/auth.service";
import "../App.css";
import Modal from "../pages/SettingsPages/Modal";
import TermsAndConditionsModal from "./SignUpPages/TermsAndConditionsModal";

const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [termsModal, setTermsModal] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      //alert("Passwords do not match");
      return;
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions to sign up");
      //alert("You must accept the Terms and Conditions to signup");
      return;
    }

    // Split full name into first and last name
    const [firstName, lastName] = fullName.trim().split(" ");

    try {
      const response = await AuthService.signup({
        first_name: firstName,
        last_name: lastName || "", // In case last name wasn't provided
        email,
        password,
      });
      if(response) {
        navigate("/food-preferences");
      }
      //navigate("/"); // Navigate to home page after successful signup
    } catch (err: any) {
      setError(
        err.response?.data?.message || "An error occurred during signup"
      );
    }
  };

  return (
    <div id="login--page">
      <div id="login--left">
        <img src="../../login-img.png"></img>
      </div>
      <div id="login--right">
        <div id="login--header">
          <h1
            style={{
              fontWeight: "700",
              fontSize: "36px",
              lineHeight: "49px",
              margin: "0px",
              color: "#525252",
            }}
          >
            Create your Account
          </h1>
          <p
            style={{
              fontWeight: "400",
              fontSize: "16px",
              lineHeight: "22px",
              color: "#525252",
            }}
          >
            Join us to start your personalized healthy eating journey
            <br />
            <br />
          </p>

          <button
            className="google-login-button"
            style={{
              opacity: 0.6,
              cursor: "not-allowed",
            }}
            title="Coming soon!" // Basic tooltip
          >
            <img src="../../google-logo.png" />
            <p
              style={{
                fontWeight: "700",
                fontSize: "14px",
                color: "#828282",
                fontFamily: "Nunito Sans",
              }}
            >
              Sign up with Google
            </p>
          </button>
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#525252",
              color: "white",
              padding: "5px 10px",
              borderRadius: "4px",
              fontSize: "12px",
              display: "none",
            }}
            className="tooltip"
          >
            Coming soon!
          </div>

          <p
            id="sign--in"
            style={{
              width: "100%",
              height: "16px",
              fontWeight: "600",
              fontSize: "12px",
              color: "#DDDDDD",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "18px",
            }}
          >
            ------------or Sign up with Email------------
          </p>
        </div>

        <div id="login--content">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}{" "}
            <div className="login--input">
              <label
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#828282",
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="login--input" style={{ marginTop: "24px" }}>
              <label
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#828282",
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="mail@abc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login--input" style={{ marginTop: "24px" }}>
              <label
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#828282",
                }}
              >
                Date of Birth
              </label>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={dateOfBirth ? new Date(dateOfBirth) : null}
                  onChange={(newValue) => {
                    setDateOfBirth(
                      newValue ? newValue.toISOString().split("T")[0] : ""
                    );
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      placeholder: "Select date",
                      sx: {
                        width: "420px", // Match the width of other inputs
                        "& .MuiInputBase-root": {
                        }
                      }
                    },
                  }}
                />
              </LocalizationProvider>
            </div>

            <div className="login--input" style={{ marginTop: "24px" }}>
              <label
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#828282",
                }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="***********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="login--input" style={{ marginTop: "24px" }}>
              <label
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#828282",
                }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="***********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div style={{ marginTop: "24px" }}>
              <label
              style={{
                fontWeight: "400",
                fontSize: "15px",
                color: "#a1a1a1",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                I have read and accept the{<a
                onClick={() => {setTermsModal("terms-conditions")}}
                href="javascript:;"
                style={{
                  fontWeight: "600",
                  fontSize: "15px",
                  color: "#7f265b",
                  textDecoration: "none",
                }}>
                  Terms and Conditions
                </a>}
              </label>
            </div>
            <button
              type="submit"
              id="login--submit"
              style={{ marginTop: "32px" }}
            >
              Create Account
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <p
              style={{
                fontWeight: "400",
                fontSize: "16px",
                color: "#525252",
                margin: 0,
              }}
            >
              Already have an account?{" "}
              <a
                onClick={() => navigate("/login")}
                style={{
                  color: "#7f265b",
                  textDecoration: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Login
              </a>
            </p>

            <p
              style={{
                fontStyle: "italic",
                fontWeight: "400",
                fontSize: "16px",
                color: "#525252",
                margin: 0,
              }}
            >
              Want to try before committing?{" "}
              <a
                onClick={() => navigate("/")}
                style={{
                  color: "#7f265b",
                  textDecoration: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Continue as guest
              </a>
            </p>
          </div>
        </div>
      </div>

      {/*Terms and Conditions Modal*/}
      <Modal 
          isOpen={termsModal === "terms-conditions"}
          onClose={() => setTermsModal(null)}
          title="Terms of Service"
          maxWidth="60%">
          <TermsAndConditionsModal />
      </Modal>
    </div>
  );
};

export default SignUpPage;

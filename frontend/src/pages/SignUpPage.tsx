import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AuthService from "../services/auth.service";
import "../styles/SignUp.css";
import Modal from "../pages/SettingsPages/Modal";
import TermsAndConditionsModal from "./SignUpPages/TermsAndConditionsModal";
import { useDispatch } from "react-redux";
import { loginUser, setGuestUser } from "../features/userSlice";

const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [termsModal, setTermsModal] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleGuestAccess = () => {
    dispatch(setGuestUser());
    navigate("/food-preferences");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions to sign up");
      return;
    }
    if (!securityQuestion || !securityAnswer) {
      setError("Please select a security question and provide an answer");
      return;
    }

    const [firstName, lastName] = fullName.trim().split(" ");

    const calculateAge = (birthDate: Date | null): number => {
      if (!birthDate) return 0;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const calculatedAge = calculateAge(dateOfBirth);

    try {
      const response = await AuthService.signup({
        first_name: firstName,
        last_name: lastName || "",
        email,
        password,
        demographicsInfo: {
          ethnicity: "",
          height: "",
          weight: "",
          age: calculatedAge,
          gender: ""
        },
        securityQuestion,
        securityAnswer
      });

      if (response) {
        try {
          await dispatch(loginUser({ email, password })).unwrap();
          navigate("/food-preferences");
        } catch (err: any) {
          setError("Signup successful but login failed. Please try logging in manually.");
          navigate("/login");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during signup");
    }
  };

  return (
    <div id="signup--page">
      <img id="signup--left" src="../../login-img.png" alt="signup" />
      <div id="signup--right">
        <div id="signup--header">
          <h1 style={{ fontWeight: "700", fontSize: "1.85vw", margin: "0px", color: "#525252" }}>
            Create your Account
          </h1>
          <p style={{ fontWeight: "400", fontSize: ".8vw", lineHeight: "1.1vw", color: "#525252" }}>
            Join us to start your personalized healthy eating journey
          </p>
        </div>

        <div id="signup--content">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="signup--input">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="signup--input">
              <label>Email</label>
              <input type="email" placeholder="mail@abc.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="login--input">
              <label>Date of Birth</label>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={dateOfBirth}
                  onChange={(newValue) => setDateOfBirth(newValue)}
                  slotProps={{
                    textField: { fullWidth: true, size: "small", placeholder: "Select date", sx: { width: "420px" } }
                  }}
                />
              </LocalizationProvider>
            </div>

            <div className="login--input">
              <label>Password</label>
              <input type="password" placeholder="***********" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="login--input">
              <label>Confirm Password</label>
              <input type="password" placeholder="***********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            {/* Security Question Dropdown */}
            <div className="signup--input">
              <label>Select a Security Question</label>
              <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)}>
                <option value="">Select a question</option>
                <option value="What is your favorite color?">What is your favorite color?</option>
                <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                <option value="What city were you born in?">What city were you born in?</option>
                <option value="What was your first pet's name?">What was your first pet's name?</option>
              </select>
            </div>

            <div className="signup--input">
              <label>Security Answer</label>
              <input type="text" placeholder="Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} />
            </div>

            <div style={{ marginTop: "3%" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                I have read and accept the
                <a onClick={() => setTermsModal("terms-conditions")} style={{ color: "#7f265b", fontWeight: "600", cursor: "pointer" }}>Terms and Conditions</a>
              </label>
            </div>

            <button type="submit" id="signup--submit" className="bg-gradient-to-r from-orange-100 to-pink-900" style={{ marginTop: "40px" }}>
              Create Account
            </button>
          </form>

          <div style={{ marginTop: "2.5%", textAlign: "center", display: "flex", flexDirection: "column", gap: "4px" }}>
            <p>Already have an account? <a onClick={() => navigate("/login")} style={{ color: "#7f265b", fontWeight: "600", cursor: "pointer" }}>Login</a></p>
            <p style={{ fontStyle: "italic" }}>Want to try before committing? <a onClick={handleGuestAccess} style={{ color: "#7f265b", fontWeight: "600", cursor: "pointer" }}>Continue as guest</a></p>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <Modal isOpen={termsModal === "terms-conditions"} onClose={() => setTermsModal(null)} title="Terms of Service" maxWidth="60%">
        <TermsAndConditionsModal />
      </Modal>
    </div>
  );
};

export default SignUpPage;

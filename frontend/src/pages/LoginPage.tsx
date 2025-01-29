import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import "../App.css";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await AuthService.login({
        email,
        password,
      });

      // Store user data in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      navigate("/home"); // Navigate to home page after successful login
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during login");
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
            Login to your Account
          </h1>
          <p
            style={{
              fontWeight: "400",
              fontSize: "16px",
              lineHeight: "22px",
              color: "#525252",
            }}
          >
            Log in to personalize your journey or explore as a guest
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
              Continue with Google
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
            ------------or Sign in with Email------------
          </p>
        </div>
        <div id="login--content">

          <form onSubmit={() => handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            <div className="login--input">
              <label
                htmlFor="email"
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#828282",
                }}
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                placeholder="mail@abc.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  console.log(email);
                }}
              />
            </div>
            <div className="login--input" style={{ marginTop: "24px" }}>
              <label
                htmlFor="password"
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
                id="password"
                placeholder="***********"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  console.log(password);
                }}
              />
            </div>

            <div
              id="login--remember"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "16px",
                marginBottom: "24px",
              }}
            >
              <label
                style={{
                  fontWeight: "400",
                  fontSize: "12px",
                  color: "#a1a1a1",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    setRememberMe(e.target.checked);
                  }}
                  style={{
                    margin: 0,
                  }}
                />
                Remember Me
              </label>

              <a
                href=""
                style={{
                  fontWeight: "600",
                  fontSize: "12px",
                  color: "#7f265b",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" id="login--submit" name='home-page'>
              Login
            </button>
          </form>

          <p
            id="create--account"
            style={{ fontWeight: "400", fontSize: "18px", color: "#828282" }}
          >
            Not registered yet?{" "}
            <a
              onClick={() => navigate("/signup")}
              style={{
                color: "#7f265b",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Create an account
            </a>
          </p>
          <p
            id="guest--account"
            style={{
              fontStyle: "italic",
              fontWeight: "400",
              fontSize: "18px",
              color: "#828282",
            }}
          >
            Want to try before commiting?{" "}
            <a
              onClick={() => {
                navigate("/");
              }}
              style={{
                color: "#7f265b",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Continue as guest
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

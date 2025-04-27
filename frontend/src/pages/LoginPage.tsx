import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, setGuestUser } from "../features/userSlice";
import { AppStore, RootState } from "../app/store";
import '../styles/Login.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const dispatch = useDispatch<AppStore>();
  const userState = useSelector((state: RootState) => (state.user));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await dispatch(loginUser({email, password, rememberMe})).unwrap();
      navigate("/food-preferences");
    } catch(err: any) {
      setError("Invalid email or password.");
    }
  };

  const handleGuestAccess = () => {
    dispatch(setGuestUser());
    navigate("/food-preferences");
  };

  return (
    <div id="login--page">
      <img id="login--left" src="../../login-img.png" alt="Login" />
      <div id="login--right">
        <div id="login--header">
          <h1
            style={{
              fontWeight: "700",
              fontSize: "2.1vw",
              margin: "0px",
              color: "#525252",
            }}
          >
            Login to your Account
          </h1>
          <p
            style={{
              fontWeight: "400",
              fontSize: ".8vw",
              lineHeight: "1.1vw",
              color: "#525252",
            }}
          >
            Log in to personalize your journey or explore as a guest
          </p>

          

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
              height: "1vh",
              fontWeight: "600",
              fontSize: ".8vw",
              color: "#DDDDDD",
              marginTop: "1.1%",
            }}
          >
          </p>
        </div>
        <div id="login--content">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}{" "}
            <div className="login--input">
              <label
                htmlFor="email"
                style={{
                  fontWeight: "600",
                  fontSize: ".82vw",
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
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="login--input" style={{ marginTop: "3%" }}>
              <label
                htmlFor="password"
                style={{
                  fontWeight: "600",
                  fontSize: ".82vw",
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
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div
              id="login--remember"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "2%",
                marginBottom: "2.5%",
              }}
            >
              <label
                style={{
                  fontWeight: "400",
                  fontSize: ".55vw",
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
                  fontSize: ".55vw",
                  color: "#7f265b",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </a>
            </div>

            <button className="bg-gradient-to-r from-orange-100 to-pink-900" type="submit" id="login--submit" name='home-page'>
              Login
            </button>
          </form>
          <div 
          style={{
            marginTop: "2.5%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
          <p
            id="create--account"
            style={{ fontWeight: "400", fontSize: ".7vw", color: "#828282" }}
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
              fontSize: ".7vw",
              color: "#828282",
            }}
          >
            Want to try before committing?{" "}
            <a
              onClick={handleGuestAccess}
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
    </div>
  );
};

export default LoginPage;

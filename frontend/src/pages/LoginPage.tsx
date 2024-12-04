// LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const navigate = useNavigate();

    return (
        <div id="login--page">
            <div id="login--left">
                <img src="../../public/login-img.png"></img>
            </div>
            <div id="login--right">
                <div id="login--header">
                    <h1 style={{fontWeight: "700", fontSize: "36px", lineHeight: "49px", margin: "0px", color: "#525252"}}>Login to your Account</h1>
                    <p style={{fontWeight: "400", fontSize: "16px", lineHeight: "22px", color: "#525252"}}>Log in to personalize your journey or explore as a guest</p>
                    <button>
                        <img src="../../public/google-logo.png"/>
                        <p style={{fontWeight: "700", fontSize: "14px", color: "#828282", fontFamily: "Nunito Sans"}}>Continue with Google</p>
                    </button>
                    <p id="sign--in" style={{width: "100%", height: "16px", fontWeight: "600", fontSize: "12px", color: "#DDDDDD", justifyContent: "center", alignItems: "center", marginTop: "36px"}}>------------or Sign in with Email------------</p>
                </div>
                <div id="login--content">
                    <form>
                        <div className="login--input">
                            <label htmlFor="email" style={{fontWeight: "600", fontSize: "14px", color: "#828282"}}>Email</label>
                            <input
                                type="text"
                                id="email"
                                placeholder="mail@abc.com"
                                value={email}
                                onChange={(e) => {setEmail(e.target.value)
                                    console.log(email);
                                }}
                            />
                        </div>
                        <div className="login--input" style={{marginTop: "24px"}}>
                            <label htmlFor="password" style={{fontWeight: "600", fontSize: "14px", color: "#828282"}}>Password</label>
                            <input 
                                type="password"
                                id="password"
                                placeholder="***********"
                                value={password}
                                onChange={(e) => {setPassword(e.target.value)
                                    console.log(password);
                                }}
                            />
                        </div>
                        <div id='login--remember'>
                            <label style={{fontWeight: "400", fontSize: "12px", color: "#a1a1a1"}}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => {setRememberMe(e.target.checked)}}
                                />
                                Remember Me
                            </label>
                            <a href="" style={{fontWeight: "600", fontSize: "12px", color: "#7f265b", textDecoration: "none"}}>Forgot password?</a>
                            
                        </div>
                        <button type="submit" id="login--submit">Login</button>
                    </form>
                    <p id="create--account" style={{fontWeight: "400", fontSize: "18px", color: "#828282"}}>
                        Not registered yet? <a href="" style={{color: "#7f265b", textDecoration: "none"}}>Create an account</a>
                    </p>
                    <p id="guest--account" style={{fontStyle: "italic", fontWeight: "400", fontSize: "18px", color: "#828282"}}>
                        Want to try before commiting? <a onClick={() => {navigate("/")}} style={{color: "#7f265b", textDecoration: "none", cursor: "pointer"}}>Continue as guest</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
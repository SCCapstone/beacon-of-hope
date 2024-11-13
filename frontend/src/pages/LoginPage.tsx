// LoginPage.tsx
import { useState } from "react";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <div className="page" id="login--page">
            <div>
                <h1>Login to your Account</h1>
                <p>See what's going on with your business</p>
            </div>
            <div>
                <form>
                    <div>
                        <label htmlFor="email">Email</label>
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
                    <div>
                        <label htmlFor="password">Password</label>
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
                    <div>
                        <div>
                            <label>
                                <input 
                                   type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => {setRememberMe(e.target.checked)}}
                                />
                                Remember Me
                            </label>
                        </div>
                        <div>
                            <a href="">Forgot password?</a>
                        </div>
                    </div>
                    <button type="submit">Login</button>
                </form>
                <p>
                    Not registered yet? <a href="">Create an account</a>
                </p>
                <p>
                    Want to try before commiting? <a href="">Continue as guest</a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
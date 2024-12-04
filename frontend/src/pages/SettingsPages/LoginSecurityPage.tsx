// LoginSecurityPage.tsx

import { useNavigate } from "react-router-dom";

const LoginSecurityPage: React.FC = () => {

    const navigate = useNavigate()

    return (
        <div className="page--content">
            <h1>Login & Security Page</h1>
            <button onClick={() => navigate(-1)}>{"< Go back"}</button>
        </div>
    );
};

export default LoginSecurityPage;
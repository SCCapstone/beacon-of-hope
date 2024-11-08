// PersonalInfoPage.tsx
import { useNavigate } from "react-router-dom";

const PersonalInfoPage: React.FC = () => {

    const navigate = useNavigate();

    return (
        <div>
            <h1>Personal Info Page</h1>
            <button onClick={() => navigate(-1)}>{"< Go Back"}</button>
        </div>
    );
};

export default PersonalInfoPage;
// PrivacySharingPage.tsx

import { useNavigate } from "react-router-dom"

const PrivacySharingPage: React.FC = () => {

    const navigate = useNavigate()

    return (
        <div className="page--content">
            <h1>Privacy & Sharing Page</h1>
            <button onClick={() => navigate(-1)}>{"< Go Back"}</button>
        </div>
    );
};

export default PrivacySharingPage;
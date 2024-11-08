// NotificationsPage.tsx

import { useNavigate } from "react-router-dom";

const NotificationsPage: React.FC = () => {

    const navigate = useNavigate()

    return (
        <div>
            <h1>Notifications Page</h1>
            <button onClick={() => navigate(-1)}>{"< Go Back"}</button>
        </div>
    );
};

export default NotificationsPage;
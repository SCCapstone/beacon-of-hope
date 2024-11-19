// PersonalInfoPage.tsx
import { ReactHTMLElement, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserInfo {
    name: string,
    email: string,
    password: string
}

const PersonalInfoPage: React.FC = () => {

    const navigate = useNavigate();
    // Initialize user info
    const [userInfo, setUserInfo] = useState<UserInfo>({
        name: '',
        email: '',
        password: ''
    });
    // TODO fetch api data to fill

    const [editingField, setEditingField] = useState<keyof UserInfo | null>(null);
    const [newValue, setNewValue] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');

    const fetchUserData = async () => {
        const user = {
            name: 'John Smith',
            email: 'jsmith@email.com',
            password: 'password'
        }
        setUserInfo(user);
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewValue(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(e.target.value);
    };

    const handleSaveField = async (field: keyof UserInfo) => {
        if(field === 'password') {
            console.log('Saving new password: ', newPassword);
            setNewPassword('');
        } else {
            const updatedUserInfo = { ...userInfo, [field]: newValue};
            setUserInfo(updatedUserInfo);
            console.log(`${field} saved`, newValue);
        }


    };

    return (
        <div>
            <h1>Personal Info Page</h1>
            <button onClick={() => navigate(-1)}>{"< Go Back"}</button>
            <form>
                <div>
                    <label></label>
                    <input />
                </div>
                <div>
                    <label></label>
                    <input />
                </div>
                <div>
                    <label></label>
                    <input />
                </div>
            </form>
        </div>
    );
};

export default PersonalInfoPage;
// WelcomePage.tsx
import WelcomeCard from '../components/WelcomeCard';
import { useDispatch } from 'react-redux';
import { setGuestUser } from '../features/userSlice';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';

const WelcomePage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGuestAccess = () => {
        dispatch(setGuestUser());
        navigate('/food-preferences');
    };

    return (
        <div id='welcome--page'>
            <img id='welcome--left' src='../../login-img.png'></img>
            <div id='welcome--right'>
                <div id='welcome--header'>
                    <h1 style={{fontFamily: "Arima", fontWeight: "700", fontSize: "3vw", margin: "0px", color: "#525252"}}>
                        Welcome!
                    </h1>
                    <p style={{fontWeight: "400", fontSize: ".9vw", color: "#525252", margin: "0px"}}>
                        Choose Your Starting Point to Personalize Your Experience
                    </p>
                </div>
                <WelcomeCard 
                    id='button--one' 
                    header='Login' 
                    desc='Access your saved preferences for a tailored experience.' 
                    to='login' 
                    data-testid="welcome-card"
                />
                <WelcomeCard 
                    id='button--two' 
                    header='Default' 
                    desc='Start with default settings for ease and simplicity.' 
                    onClick={handleGuestAccess}
                />
                {/* <WelcomeCard id='button--three' header='Personas' desc='Explore different meal styles and explore one that suits your goals.' to='personas'></WelcomeCard> */}
            </div>
        </div>
    );
};

export default WelcomePage;

// WelcomePage.tsx
import WelcomeCard from '../components/WelcomeCard';

const WelcomePage: React.FC = () => {
    return (
        <div id='welcome--page'>
            <div id='welcome--left'>
                <img src='../../login-img.png'></img>
            </div>
            <div id='welcome--right'>
                <div id='welcome--header'>
                    <h1 style={{fontFamily: "Arima", fontWeight: "700", fontSize: "48px", margin: "0px", color: "#525252"}}>
                        Welcome!
                    </h1>
                    <p style={{fontWeight: "400", fontSize: "20px", color: "#525252", margin: "0px"}}>
                        Choose Your Starting Point to Personalize Your Experience
                    </p>
                </div>
                <WelcomeCard id='button--one' header='Login' desc='Access your saved preferences for a tailored experience.' to='login'></WelcomeCard>
                <WelcomeCard id='button--two' header='Default' desc='Start with our recommended settings for ease and simplicity.' to=''></WelcomeCard>
                <WelcomeCard id='button--three' header='Personas' desc='Explore different meal styles and explore one that suits your goals.' to='personas'></WelcomeCard>
            </div>
        </div>
    );
};

export default WelcomePage;

// WelcomePage.tsx
import WelcomeCard from '../components/WelcomeCard';

const WelcomePage: React.FC = () => {
    return (
        <div>
            <h1>Welcome!</h1>
            <p>Choose Your Starting Point to Personalize Your Experience</p>
            <WelcomeCard header='Login' desc='Access your saved preferences for a tailored experience.' to='login'></WelcomeCard>
            <WelcomeCard header='Default' desc='Start with our recommended settings for ease and simplicity.' to='/home'></WelcomeCard>
            <WelcomeCard header='Personas' desc='Explore different meal styles and explore one that suits your goals.' to='/personas'></WelcomeCard>
        </div>
    );
};

export default WelcomePage;
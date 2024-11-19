// WelcomeCard.tsx
import { useNavigate } from "react-router-dom";

interface Props {
    header: string,
    desc: string,
    to: string
}

const WelcomeCard: React.FC<Props> = ({ header, desc, to }) => {

    const navigate = useNavigate();

    return (
        <button onClick={() => navigate(`/${to}`)}>
            <h2>{header}</h2>
            <p>{desc}</p>
        </button>
    );
};

export default WelcomeCard;
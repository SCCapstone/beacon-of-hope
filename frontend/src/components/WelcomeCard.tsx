// WelcomeCard.tsx
import { useNavigate } from "react-router-dom";

interface Props {
    id: string,
    header: string,
    desc: string,
    to: string
}

const WelcomeCard: React.FC<Props> = ({ id, header, desc, to}) => {

    const navigate = useNavigate();

    return (
        <button onClick={() => navigate(`/${to}`)} className="welcome--button" id={id}>
            <h2 style={{fontFamily: "Arima", fontWeight: "500", fontSize: "33px"}}>{header}</h2>
            <p style={{}}>{desc}</p>
        </button>
    );
};

export default WelcomeCard;
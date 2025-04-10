// WelcomeCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface WelcomeCardProps {
    id: string;
    header: string;
    desc: string;
    to?: string;
    onClick?: () => void;
    'data-testid'?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ id, header, desc, to, onClick, 'data-testid': dataTestId }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            navigate(to);
        }
    };

    return (
        <button 
            onClick={handleClick}
            className="welcome--button" 
            id={id}
            data-testid={dataTestId}
        >
            <h2 style={{fontFamily: "Arima", fontWeight: "500", fontSize: "33px"}}>{header}</h2>
            <p>{desc}</p>
        </button>
    );
};

export default WelcomeCard;
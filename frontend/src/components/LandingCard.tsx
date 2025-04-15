// LandingCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

interface LandingCardProps {
    id: string;
    header: string;
    desc: string;
    to?: string;
    onClick?: () => void;
}

const LandingCard: React.FC<LandingCardProps> = ({ id, header, desc, to, onClick}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            navigate(to);
        }
    }

    return (
        <button 
            onClick={handleClick}
            className="landing--button" 
            id={id}
        >
            <h2 style={{fontFamily: "Arima", fontWeight: "500", fontSize: "33px"}}>{header}</h2>
            <p>{desc}</p>
        </button>
    );
}   

export default LandingCard;

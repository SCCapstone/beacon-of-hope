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
            className="bg-gradient-to-r from-orange-200 to-pink-800 rounded-2xl" 
            id={id}
        >
            <h2 className="text-white">{header}</h2>
            <p>{desc}</p>
        </button>
    );
}   

export default LandingCard;

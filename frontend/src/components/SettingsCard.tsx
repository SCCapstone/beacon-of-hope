// SettingsCard.tsc
import { useNavigate } from "react-router-dom"

interface Props  {
    name: string,
    desc: string,
    img: string,
    to: string
}

const SettingsCard: React.FC<Props> = ({ name, desc, img, to }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/${to}`)
    }

    return (
        <button onClick={handleClick}>
            <img src={img}/>
            <h3>{name}</h3>
            <p>{desc}</p>
        </button>
    );
};

export default SettingsCard;
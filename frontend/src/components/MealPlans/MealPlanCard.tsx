// MealPlanCard.tsx
import { Favorite, Delete } from "@mui/icons-material";

interface Props {
    mealType: string,
    img: string,
    foodName: string,
    desc: string
}

const MealPlanCard: React.FC<Props> = ({ mealType, img, foodName, desc}) => {
    return (
        <div>
            <h2>{mealType}</h2>
            <img src={img}/>
            <button>{<Delete />}</button>
            <button>{<Favorite />}</button>
            <h3>{foodName}</h3>
            <p>{desc}</p>
        </div>
    );
};

export default MealPlanCard;
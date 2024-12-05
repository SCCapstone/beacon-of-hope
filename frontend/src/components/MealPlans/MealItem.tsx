// MealItem.tsx
import { Favorite, Delete } from "@mui/icons-material";

interface Props {
    item: object,
    type: string
}

const MealItem: React.FC<Props> = ({item, type}) => {
    return(
        <div id="meal--item">
            <h1>{type}</h1>
            <div id="item--stuff">
                <button><Delete /></button>
                <button><Favorite /></button>
            </div>
            <h2>{item.recipe_name}</h2>
        </div>
    );
};

export default MealItem;
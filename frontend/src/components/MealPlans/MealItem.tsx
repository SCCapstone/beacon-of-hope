import { Favorite, Delete } from "@mui/icons-material";
import "./MealPlanCard.css";

interface Props {
    item: any; // Use appropriate type if available
    type: string;
}

const MealItem: React.FC<Props> = ({ item, type }) => {
    return (
        <div className="card">
            <div className="card-header">
                <h3>{type}</h3>
                <div className="action-buttons">
                    <button className="action-button">
                        <Delete />
                    </button>
                    <button className="action-button">
                        <Favorite />
                    </button>
                </div>
            </div>
            <div
                className="card-image"
                style={{ backgroundImage: `url(${item.image || 'placeholder.jpg'})` }}
            >
                {/* Optional image rendering */}
            </div>
            <div className="card-footer">
                <h4>{type === "Beverage" ? item.name : item.recipe_name || "Unknown Recipe"}</h4>
                {/* Optional details if needed */}
            </div>
        </div>
    );
};

export default MealItem;

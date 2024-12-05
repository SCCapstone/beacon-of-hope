import React from "react";
import { Meal } from "./types";

interface MealDetailPopupProps {
  meal: Meal;
  position: { x: number; y: number };
  containerBounds: DOMRect;
  onClose: () => void;
  onCompare: () => void;
  isCompareMode: boolean;
}

const MealDetailPopup: React.FC<MealDetailPopupProps> = ({
  meal,
  position,
  containerBounds,
  onClose,
  onCompare,
  isCompareMode,
}) => {
  // Calculate popup position to keep it within bounds
  const popupWidth = 320; // width of popup (same as w-80)
  const popupHeight = 300; // approximate height of popup

  // Calculate adjusted position
  let adjustedX = position.x;
  let adjustedY = position.y;

  // Adjust X position if popup would overflow right side
  if (position.x + popupWidth > containerBounds.right) {
    adjustedX = position.x - popupWidth;
  }

  // Adjust Y position if popup would overflow bottom
  if (position.y + popupHeight > containerBounds.bottom) {
    adjustedY = position.y - popupHeight;
  }

  // Ensure popup doesn't go above the top of the container
  if (adjustedY < containerBounds.top) {
    adjustedY = containerBounds.top;
  }

  return (
    <div
      className="fixed bg-white rounded-lg shadow-xl p-4 z-50 w-80"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>

      <h3 className="font-semibold text-lg mb-2">{meal.name}</h3>
      <p className="text-gray-600 text-sm mb-3">Time: {meal.time}</p>

      <div className="mb-4">
        <h4 className="font-medium text-sm mb-2">Ingredients:</h4>
        <div className="max-h-40 overflow-y-auto">
          {meal.ingredients.map((ing, idx) => (
            <div key={idx} className="text-sm mb-1 flex justify-between">
              <span className="text-gray-700">{ing.name}</span>
              <span className="text-gray-500">
                {ing.amount} {ing.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isCompareMode && (
        <button
          onClick={onCompare}
          className="w-full bg-blue-500 text-white rounded px-4 py-2 text-sm hover:bg-blue-600"
        >
          Compare with another meal
        </button>
      )}
    </div>
  );
};

export default MealDetailPopup;

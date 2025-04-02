import React from "react";
import { motion } from "framer-motion";
import { VisualizationLevel } from "../types";

interface LevelSelectorProps {
  currentLevel: VisualizationLevel["type"];
  onLevelChange: (level: VisualizationLevel["type"]) => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevel,
  onLevelChange,
}) => {
  const levels: VisualizationLevel["type"][] = ["meal", "food", "ingredient"];

  const handleClick = (level: VisualizationLevel["type"]) => (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up
    onLevelChange(level);
  };

  return (
    <div className="level-selector flex items-center space-x-2">
      {levels.map((level) => (
        <motion.button
          key={level}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentLevel === level
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={handleClick(level)}
        >
          <span className="capitalize">{level}</span>
        </motion.button>
      ))}
    </div>
  );
};

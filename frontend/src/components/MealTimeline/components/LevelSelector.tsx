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

  const handleClick =
    (level: VisualizationLevel["type"]) => (e: React.MouseEvent) => {
      e.stopPropagation(); // Stop event from bubbling up
      onLevelChange(level);
    };

  return (
    <div className="level-selector flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
      {" "}
      {/* Container with background and padding */}
      {levels.map((level) => (
        <motion.button
          key={level}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none
            ${
              currentLevel === level
                ? "text-white z-10" // Active text color
                : "text-[#A52A2A] hover:bg-gray-200/70" // Inactive text (brighter brown), subtle hover
            }`}
          onClick={handleClick(level)}
          style={{ WebkitTapHighlightColor: "transparent" }} // Remove tap highlight on mobile
        >
          {currentLevel === level && (
            <motion.div
              layoutId="activeLevelBackground" // Animate background separately
              className="absolute inset-0 bg-[#8B4513] rounded-md z-0" // Primary color background
              initial={{ borderRadius: 6 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 capitalize">{level}</span>{" "}
          {/* Ensure text is above background */}
        </motion.button>
      ))}
    </div>
  );
};

import React, { useState } from "react";
import { motion } from "framer-motion";

interface MealBinConfiguratorProps {
  mealBinNames: string[];
  onUpdate: (newNames: string[]) => void;
}

export const MealBinConfigurator: React.FC<MealBinConfiguratorProps> = ({
  mealBinNames,
  onUpdate,
}) => {
  const [editedNames, setEditedNames] = useState<string[]>([...mealBinNames]);
  const [isEditing, setIsEditing] = useState(false);

  const handleNameChange = (index: number, newName: string) => {
    const newNames = [...editedNames];
    newNames[index] = newName;
    setEditedNames(newNames);
  };

  const handleAddBin = () => {
    setEditedNames([...editedNames, `Meal ${editedNames.length + 1}`]);
  };

  const handleRemoveBin = (index: number) => {
    if (editedNames.length <= 1) return; // Don't remove the last bin
    const newNames = [...editedNames];
    newNames.splice(index, 1);
    setEditedNames(newNames);
  };

  const handleSave = () => {
    // Filter out empty names and trim whitespace
    const processedNames = editedNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    // Ensure we have at least one bin
    if (processedNames.length === 0) {
      processedNames.push("Meal 1");
    }

    onUpdate(processedNames);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNames([...mealBinNames]);
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">Meal Bins</h3>

        {!isEditing ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 bg-[#8FBC8F]/20 text-[#3B8E6B] rounded-md text-sm font-medium hover:bg-[#8FBC8F]/30" // Secondary color light
            onClick={() => setIsEditing(true)}
          >
            Edit
          </motion.button>
        ) : (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200" // Neutral
              onClick={handleCancel}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-[#5CB85C]/90 text-white rounded-md text-sm font-medium hover:bg-[#5CB85C]" // Accent Green
              onClick={handleSave}
            >
              Save
            </motion.button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="flex flex-wrap gap-2">
          {mealBinNames.map((name, index) => (
            <div
              key={`bin-${index}`}
              className="px-3 py-1.5 bg-[#8B4513]/10 text-[#8B4513] rounded-md text-sm" // Primary color lighter
            >
              {name}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {editedNames.map((name, index) => (
            <div
              key={`edit-bin-${index}`}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-[#E0E0E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#A0522D]/50 focus:border-[#A0522D]/50" // Neutral border, primary focus ring
                placeholder={`Meal ${index + 1}`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-md transition-colors ${
                  editedNames.length <= 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#D9534F] hover:bg-[#D9534F]/10" // Accent Red
                }`}
                onClick={() => handleRemoveBin(index)}
                disabled={editedNames.length <= 1}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </motion.button>
            </div>
          ))}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 mt-2 bg-[#8FBC8F]/20 text-[#3B8E6B] rounded-md text-sm font-medium flex items-center justify-center hover:bg-[#8FBC8F]/30" // Secondary color light
            onClick={handleAddBin}
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Meal Bin
          </motion.button>
        </div>
      )}
    </div>
  );
};

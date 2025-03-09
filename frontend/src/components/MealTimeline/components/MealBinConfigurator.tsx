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
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
            onClick={() => setIsEditing(true)}
          >
            Edit Bins
          </motion.button>
        ) : (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium"
              onClick={handleCancel}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm font-medium"
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
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm"
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
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder={`Meal ${index + 1}`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
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
            className="w-full py-2 mt-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium flex items-center justify-center"
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

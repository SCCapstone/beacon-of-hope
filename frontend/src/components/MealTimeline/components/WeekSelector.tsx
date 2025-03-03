import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { format, addDays, subDays, parseISO } from "date-fns";

interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  // Get the 3-day range (previous day, selected day, next day)
  const startDate = subDays(selectedDate, 1);
  const endDate = addDays(selectedDate, 1);

  const formatDateRange = () => {
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  // Move by a single day in either direction
  const moveDay = useCallback((direction: "prev" | "next", e: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();
    
    const offset = direction === "next" ? 1 : -1;
    const newDate = addDays(selectedDate, offset);
    console.log(`Moving ${direction} to:`, format(newDate, "yyyy-MM-dd"));
    onDateChange(newDate);
    
    // Return false to prevent any other handlers
    return false;
  }, [selectedDate, onDateChange]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.target.value) return;
    
    try {
      // Parse the date from the input
      const newDate = parseISO(e.target.value);
      console.log("Date input changed to:", format(newDate, "yyyy-MM-dd"));
      onDateChange(newDate);
    } catch (error) {
      console.error("Error parsing date:", error);
    }
  }, [onDateChange]);

  return (
    <div className="flex items-center space-x-4" onClick={e => e.stopPropagation()}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={(e) => moveDay("prev", e)}
        aria-label="Previous day"
        type="button" // Explicitly set button type
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </motion.button>

      <div className="flex items-center space-x-2">
        <span className="text-gray-600">{formatDateRange()}</span>
        <input
          type="date"
          value={format(selectedDate, "yyyy-MM-dd")}
          onChange={handleDateChange}
          className="px-2 py-1 border rounded hover:border-gray-400 focus:outline-none focus:border-blue-500"
          onClick={e => e.stopPropagation()}
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={(e) => moveDay("next", e)}
        aria-label="Next day"
        type="button" // Explicitly set button type
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.button>
    </div>
  );
};

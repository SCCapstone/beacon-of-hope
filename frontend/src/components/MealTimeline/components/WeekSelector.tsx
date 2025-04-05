import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";

interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void; // Expects a Date object
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  // Move by a single day in either direction
  const moveDay = useCallback((direction: "prev" | "next", e: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();

    const offset = direction === "next" ? 1 : -1;
    // Ensure selectedDate is valid before adding days
    const baseDate = isValid(selectedDate) ? selectedDate : new Date();
    const newDate = addDays(baseDate, offset);
    // console.log(`Moving ${direction} to:`, format(newDate, "yyyy-MM-dd"));
    onDateChange(newDate); // Pass Date object

    return false;
  }, [selectedDate, onDateChange]);

  const handleDateInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.target.value) return;

    try {
      // Parse the date string from the input (YYYY-MM-DD)
      // parseISO handles this format correctly, including timezone offset if present
      // but for date-only input, it assumes local timezone midnight which is usually fine.
      const newDate = parseISO(e.target.value);
      if (isValid(newDate)) { // Check if parsing was successful
        // console.log("Date input changed to:", format(newDate, "yyyy-MM-dd"));
        onDateChange(newDate); // Pass Date object
      } else {
        console.error("Invalid date input:", e.target.value);
      }
    } catch (error) {
      console.error("Error parsing date input:", error);
    }
  }, [onDateChange]);

  // Format selectedDate for display and input value, handle potential invalid date
  const displayDateStr = isValid(selectedDate) ? format(selectedDate, "MMMM d, yyyy") : "Invalid Date";
  const inputDateStr = isValid(selectedDate) ? format(selectedDate, "yyyy-MM-dd") : "";


  return (
    <div className="flex items-center space-x-4" onClick={e => e.stopPropagation()}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={(e) => moveDay("prev", e)}
        aria-label="Previous day"
        type="button"
      >
        {/* SVG Left Arrow */}
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </motion.button>

      <div className="flex items-center space-x-2">
        <span className="text-gray-600 font-medium">
          {displayDateStr}
        </span>
        <input
          type="date"
          value={inputDateStr}
          onChange={handleDateInputChange} // Use specific handler for input change
          className="px-2 py-1 border rounded hover:border-gray-400 focus:outline-none focus:border-blue-500"
          onClick={e => e.stopPropagation()} // Prevent main area click handler
          aria-label="Select date"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={(e) => moveDay("next", e)}
        aria-label="Next day"
        type="button"
      >
        {/* SVG Right Arrow */}
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </motion.button>
    </div>
  );
};
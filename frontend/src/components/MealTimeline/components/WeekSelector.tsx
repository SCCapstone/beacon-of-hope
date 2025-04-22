import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { format, addDays, isValid, startOfDay } from "date-fns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3"; // Use v3 adapter
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void; // Expects a Date object
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  // Move by a single day in either direction
  const moveDay = useCallback(
    (direction: "prev" | "next", e: React.MouseEvent) => {
      // Prevent default behavior and stop propagation
      e.preventDefault();
      e.stopPropagation();

      const offset = direction === "next" ? 1 : -1;
      // Ensure selectedDate is valid before adding days
      const baseDate = isValid(selectedDate) ? selectedDate : new Date();
      const newDate = addDays(baseDate, offset);
      // console.log(`Moving ${direction} to:`, format(newDate, "yyyy-MM-dd"));
      onDateChange(startOfDay(newDate)); // Pass normalized Date object

      return false;
    },
    [selectedDate, onDateChange]
  );

  const handleDateInputChange = useCallback(
    (newValue: Date | null) => {
      if (newValue && isValid(newValue)) {
        console.log(
          "MUI DatePicker changed to:",
          format(newValue, "yyyy-MM-dd")
        );
        onDateChange(startOfDay(newValue)); // Pass normalized Date object
      } else {
        console.error("Invalid date from MUI DatePicker:", newValue);
      }
    },
    [onDateChange]
  );

  // Ensure selectedDate is valid for the DatePicker value prop
  const validSelectedDate = isValid(selectedDate) ? selectedDate : null;

  return (
    <div
      className="flex items-center space-x-2"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={(e) => moveDay("prev", e)}
        aria-label="Previous day"
        type="button"
      >
        {/* SVG Left Arrow */}
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </motion.button>

      {/* MUI Date Picker */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          value={validSelectedDate}
          onChange={handleDateInputChange}
          slotProps={{
            textField: {
              size: "small",
              sx: { minWidth: "150px" }, // Adjust width as needed
              InputProps: { sx: { fontSize: "0.875rem" } }, // Smaller font size
              variant: "outlined", // Use outlined variant for consistency
            },
            // Optional: Customize other slots like calendar header, day, etc.
          }}
          // Optional: Add date constraints if needed
          // minDate={...}
          // maxDate={...}
        />
      </LocalizationProvider>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={(e) => moveDay("next", e)}
        aria-label="Next day"
        type="button"
      >
        {/* SVG Right Arrow */}
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
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

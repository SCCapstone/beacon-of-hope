import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { format, addDays, isValid, startOfDay } from "date-fns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3"; // Use v3 adapter
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { createTheme, ThemeProvider } from "@mui/material/styles"; // Import MUI theme utilities

interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

// Define a simple MUI theme override for the DatePicker
const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#8B4513", // Use your primary color
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "6px", // Match Tailwind's rounded-md
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#A0522D", // Slightly lighter primary on focus
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#FFFFFF", // Neutral border on hover
          },
        },
        notchedOutline: {
          borderColor: "#E0E0E0", // Default neutral border
        },
      },
    },
    MuiButtonBase: {
      // Style calendar day selection etc.
      styleOverrides: {
        root: {
          "&.MuiPickersDay-root.Mui-selected": {
            backgroundColor: "#8B4513", // Primary color for selected day
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#A0522D", // Slightly lighter primary on hover
            },
            "&:focus": {
              backgroundColor: "#8B4513",
            },
          },
          "&.MuiPickersDay-root.MuiPickersDay-today": {
            borderColor: "#8B4513", // Primary border for today
          },
        },
      },
    },
  },
});

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
    // Wrap with ThemeProvider to apply overrides
    <ThemeProvider theme={muiTheme}>
      <div
        className="flex items-center space-x-1" // Reduced space
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-1.5 rounded-full hover:bg-gray-100" // Smaller padding
          onClick={(e) => moveDay("prev", e)}
          aria-label="Previous day"
          type="button"
        >
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

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            value={validSelectedDate}
            onChange={handleDateInputChange}
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  minWidth: "140px",
                  "& .MuiInputBase-input": {
                    fontSize: "0.875rem",
                    padding: "8.5px 10px",
                  },
                }, // Adjusted width, font, padding
                variant: "outlined",
              },
              // Add popover props to prevent closing panel on click inside calendar
              popper: {
                placement: "bottom-end", // Adjust placement if needed
                // Prevent clicks inside the calendar from closing the details panel
                // This relies on the panel's click-outside handler checking for .MuiPopover-root
                // No direct prop needed here, ensure the check exists in MealCalendarViz
              },
              // Ensure calendar doesn't close panel
              dialog: {
                // Similar to popper, rely on MealCalendarViz check
              },
            }}
          />
        </LocalizationProvider>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-1.5 rounded-full hover:bg-gray-100" // Smaller padding
          onClick={(e) => moveDay("next", e)}
          aria-label="Next day"
          type="button"
        >
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
    </ThemeProvider>
  );
};

import React from "react";
import { motion } from "framer-motion";
import { startOfWeek, addDays, format, parseISO } from "date-fns";
import { toDate, toZonedTime } from "date-fns-tz";

interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  // Get user's timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const getWeekDates = (date: Date): Date[] => {
    // Convert to user's timezone
    const zonedDate = toZonedTime(date, timeZone);
    const weekStart = startOfWeek(zonedDate, { weekStartsOn: 0 }); // Start on Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const weekDates = getWeekDates(selectedDate);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  const formatDateRange = () => {
    return `${format(startDate, "MMMM d, yyyy")} - ${format(
      endDate,
      "MMMM d, yyyy"
    )}`;
  };

  const moveWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    onDateChange(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert the selected date to a proper Date object while preserving the timezone
    const localDate = parseISO(e.target.value);
    const tzDate = toDate(localDate, { timeZone }); // Convert to date in the specified timezone
    onDateChange(tzDate);
  };

  return (
    <div className="flex items-center space-x-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={() => moveWeek("prev")}
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
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={() => moveWeek("next")}
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

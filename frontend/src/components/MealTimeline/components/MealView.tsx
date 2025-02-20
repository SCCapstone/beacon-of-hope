import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { DayMeals, Meal } from "../types";
import { COLOR_SCHEMES, TIME_SLOTS } from "../constants";
import { format, addDays, isSameDay, subDays, startOfDay } from "date-fns";
import { RecommendedMealCard } from "./RecommendedMealCard";
import { MealRecommendation } from "../types";

interface MealViewProps {
  weekData: DayMeals[];
  selectedDate: Date;
  onMealSelect: (meal: Meal | null) => void;
  selectedMeal: Meal | null;
  onRecommendationSelect: (recommendation: MealRecommendation | null) => void;
  selectedRecommendation: MealRecommendation | null;
}

export const MealView: React.FC<MealViewProps> = ({
  weekData,
  selectedDate,
  onMealSelect,
  selectedMeal,
  onRecommendationSelect,
  selectedRecommendation,
}) => {
  // Generate 3-day dates centered on selected date
  const threeDayDates = useMemo(() => {
    const currentDate = startOfDay(selectedDate);
    return [subDays(currentDate, 1), currentDate, addDays(currentDate, 1)];
  }, [selectedDate]);

  const getMealsForDate = (
    targetDate: Date
  ): {
    meals: Meal[];
    isEmpty: boolean;
    recommendations: MealRecommendation[];
  } => {
    // Find the day data that matches the target date
    const dayData = weekData.find((day) =>
      isSameDay(new Date(day.date), targetDate)
    );

    if (!dayData) {
      return {
        meals: [],
        isEmpty: false,
        recommendations: [],
      };
    }

    return {
      meals: dayData.meals || [],
      isEmpty: dayData.isEmpty || false,
      recommendations: dayData.recommendations || [],
    };
  };

  const getDayData = (targetDate: Date) => {
    return weekData.find((day) => isSameDay(new Date(day.date), targetDate));
  };

  const getRecommendationsForDate = (targetDate: Date) => {
    const dayData = weekData.find((day) =>
      isSameDay(new Date(day.date), targetDate)
    );
    return dayData?.recommendations || [];
  };

  const getTimePosition = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotsFromStart = hours - 6;
    const slotHeight = 100;

    // Calculate base position from hours
    const basePosition = slotsFromStart * slotHeight;

    // Add partial position from minutes (80px per hour = 1.333... px per minute)
    const minutePosition = (minutes / 60) * slotHeight;

    return `${basePosition + minutePosition}px`;
  };

  const isMealSelected = (meal: Meal) => {
    return (
      selectedMeal?.id === meal.id &&
      selectedMeal?.name === meal.name &&
      selectedMeal?.time === meal.time
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fixed header for days */}
      <div className="flex border-b bg-white z-20">
        {/* Time column header */}
        <div className="w-20 flex-shrink-0" />

        {/* Days headers */}
        {threeDayDates.map((date) => (
          <div
            key={date.toISOString()}
            className="flex-1 p-4 border-l border-gray-200"
          >
            <div className="text-sm font-medium text-gray-600">
              {format(date, "EEEE")}
            </div>
            <div className="text-xs text-gray-500">{format(date, "MMM d")}</div>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex h-full">
          {/* Time slots column */}
          <div className="w-24 flex-shrink-0 bg-white z-10 border-r">
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="h-[100px] border-b border-gray-200 flex items-center justify-end pr-2"
              >
                <span className="text-sm text-gray-500">
                  {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                </span>
              </div>
            ))}
          </div>

          {/* Main grid area */}
          <div className="flex-1 relative">
            {/* Background grid */}
            <div className="absolute inset-0">
              {TIME_SLOTS.map((time) => (
                <div key={time} className="flex h-[100px]">
                  {threeDayDates.map((date) => {
                    const dayData = getDayData(date);
                    const isEmpty = dayData?.isEmpty || false;

                    return (
                      <div
                        key={`${date.toISOString()}-${time}`}
                        className={`flex-1 border-b border-l ${
                          isEmpty ? "bg-gray-50" : "border-gray-100"
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Regular Meals */}
            <div className="absolute inset-0">
              {threeDayDates.map((date, dayIndex) => {
                const dayData = getDayData(date);
                if (!dayData || dayData.isEmpty) return null;

                return dayData.meals.map((meal) => (
                  <motion.div
                    key={`${date.toISOString()}-${meal.id}-${meal.time}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    className={`meal-card absolute p-3 rounded-lg cursor-pointer
                      transform transition-all duration-300
                      ${isMealSelected(meal) ? "ring-2 ring-blue-500" : ""}
                      bg-white/90 backdrop-blur-sm`}
                    style={{
                      top: getTimePosition(meal.time),
                      left: `${(dayIndex * 100) / 3}%`,
                      width: `${85 / 3}%`, // Match recommendation width
                      transform: "translateX(7.5%)", // Match recommendation centering
                      height: "80px", // Match recommendation height
                      boxShadow: isMealSelected(meal)
                        ? "0 0 15px rgba(16, 185, 129, 0.2)"
                        : "0 2px 4px rgba(0,0,0,0.05)",
                      zIndex: isMealSelected(meal) ? 20 : 15,
                    }}
                    onClick={() => onMealSelect(isMealSelected(meal) ? null : meal)}
                  >
                    {/* Header Section */}
                    <div className="relative h-full flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-800 truncate pr-10">
                          {meal.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-gray-500">{meal.time}</span>
                          {meal.diabetesFriendly && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              DF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Section */}
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{meal.nutritionalInfo.calories} cal</span>
                        <span>{meal.nutritionalInfo.carbs}g carbs</span>
                      </div>
                    </div>

                    {/* Selection Effect */}
                    {isMealSelected(meal) && (
                      <motion.div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        animate={{
                          boxShadow: [
                            "0 0 0 rgba(59, 130, 246, 0)",
                            "0 0 20px rgba(59, 130, 246, 0.3)",
                            "0 0 0 rgba(59, 130, 246, 0)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      />
                    )}
                  </motion.div>
                ));
              })}
            </div>

            {/* Recommendations */}
            {threeDayDates.map((date, dayIndex) => {
              const dayData = getDayData(date);
              if (!dayData?.recommendations?.length) return null;

              return dayData.recommendations.map((recommendation) => (
                <motion.div
                  key={`${date.toISOString()}-${recommendation.meal.id}`}
                  className="absolute"
                  style={{
                    top: getTimePosition(recommendation.meal.time),
                    left: `${(dayIndex * 100) / 3}%`,
                    width: `${85 / 3}%`, // Slightly smaller than regular meals
                    transform: "translateX(7.5%)", // Centered
                    zIndex: dayData.isEmpty ? 15 : 10,
                  }}
                >
                  <RecommendedMealCard
                    key={`${date.toISOString()}-${recommendation.meal.id}`}
                    className="recommendation-card"
                    recommendation={recommendation}
                    onClick={() => {
                      onRecommendationSelect(
                        selectedRecommendation?.meal.id ===
                          recommendation.meal.id
                          ? null
                          : recommendation
                      );
                    }}
                    isSelected={
                      selectedRecommendation?.meal.id === recommendation.meal.id
                    }
                    isEmptyDay={dayData.isEmpty}
                  />
                </motion.div>
              ));
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

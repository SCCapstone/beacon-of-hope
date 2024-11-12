// Wireframe for an interactive timeline visualization that maps out meals throughout the day or week -> To be implemented

import React from 'react';

// Interface for the meal timeline explore component
interface MealTimelineExploreProps {
  data: { name: string; value: number }[];
}

// MealTimelineExplore component
export const MealTimelineExplore: React.FC<MealTimelineExploreProps> = ({
  data,
}) => {
  return (
    // Wireframe for meal timeline explore component using placeholders for `data` for now
    <div>
      <div className="flex flex-col gap-4">
        {data.map((entry, index) => (
          <div key={`meal-${index}`} className="flex items-center justify-between">
            <div>{entry.name}</div>
            <div>{entry.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

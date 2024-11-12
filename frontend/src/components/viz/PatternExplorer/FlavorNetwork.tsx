// Wireframe for a network graph where meals are nodes connected by shared ingredients or nutritional profiles -> To be implemented

import React from 'react';

// Interface for the flavor network component
interface FlavorNetworkProps {
  data: { name: string; value: number }[];
}

// FlavorNetwork component
export const FlavorNetwork: React.FC<FlavorNetworkProps> = ({
  data,
}) => {
  return (
    // Wireframe for flavor network component using placeholders for `data` for now
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

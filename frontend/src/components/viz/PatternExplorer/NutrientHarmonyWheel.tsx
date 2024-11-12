// Wireframe for a dynamic circular chart displaying the balance of nutrients in meals -> To be implemented

import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

// Interface for the nutrient harmony wheel
interface NutrientHarmonyWheelProps {
  data: { name: string; value: number }[];
}

// NutrientHarmonyWheel component
export const NutrientHarmonyWheel: React.FC<NutrientHarmonyWheelProps> = ({
  data,
}) => {
  return (
    <PieChart width={400} height={400}>
      <Pie
        data={data}
        dataKey="value"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#8884d8"
        label
      >
        {data.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={`#${index}0000`} />
        ))}
      </Pie>
    </PieChart>
  );
};

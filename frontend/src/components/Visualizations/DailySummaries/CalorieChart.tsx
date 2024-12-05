interface CalorieChartProps {
  data: number[];
}

export const CalorieChart: React.FC<CalorieChartProps> = ({ data }) => {
  return (
    // Wireframe for calorie chart display using placeholders for `data` for now
    <div className="flex flex-col gap-4">
      {data.map((calories, index) => (
        <div key={index} className="flex items-center justify-between">
          <div>{index + 1}</div>
          <div>{calories}</div>
        </div>
      ))}
    </div>
  );
};

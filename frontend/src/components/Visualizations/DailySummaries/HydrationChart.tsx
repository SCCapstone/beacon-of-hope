interface HydrationChartProps {
  data: number[];
}

export const HydrationChart: React.FC<HydrationChartProps> = ({ data }) => {
  return (
    // Wireframe for hydration chart display using placeholders for `data` for now
    <div className="flex flex-col gap-4">
      {data.map((hydration, index) => (
        <div key={index} className="flex items-center justify-between">
          <div>{index + 1}</div>
          <div>{hydration}</div>
        </div>
      ))}
    </div>
  );
};

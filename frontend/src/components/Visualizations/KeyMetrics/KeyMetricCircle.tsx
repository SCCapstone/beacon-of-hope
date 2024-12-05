interface KeyMetricCircleProps {
  value: number;
  label: string;
  color: string;
}

export const KeyMetricCircle: React.FC<KeyMetricCircleProps> = ({
  value,
  label,
  color,
}) => {
  return (
    // Wireframe for circular metric display using
    // placeholders for the value, label, and color for now
    <div
      className={`flex items-center justify-center w-24 h-24 rounded-full bg-${color}-100`}
    >
      <div className={`text-${color}-500 text-3xl font-bold`}>{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
};

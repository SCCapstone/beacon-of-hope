interface ImprovementArea {
  label: string;
  score: number;
}

export const ImprovementAreas: React.FC<{ areas: ImprovementArea[] }> = ({
  areas,
}) => {
  return (
    // Wireframe for improvement areas using placeholders for `areas` for now
    <div className="flex flex-col gap-4">
      {areas.map((area) => (
        <div key={area.label} className="flex items-center justify-between">
          <div>{area.label}</div>
          <div>{area.score}</div>
        </div>
      ))}
    </div>
  );
};

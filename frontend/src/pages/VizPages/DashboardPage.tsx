import { DailySummaries } from "./DailySummariesPage";
import { KeyMetrics } from "./KeyMetricsPage";
import { NutritionalHarmonyWheel } from "./NutrientalHarmonyPage";
import { MealTimelineExplore } from "./MealTimelinePage";
import { FlavorNetwork } from "./FlavorNetworkPage";

export const DashboardPage = () => {
  return (
    <div>
      <h1>Meal Insights Dashboard</h1>
      <h2>Visualize Your Nutritional Journey</h2>
      <div>
        <KeyMetrics />
        <DailySummaries />
      </div>
      <div>
        <NutritionalHarmonyWheel />
        <MealTimelineExplore />
        <FlavorNetwork />
      </div>
    </div>
  );
};

export default DashboardPage;

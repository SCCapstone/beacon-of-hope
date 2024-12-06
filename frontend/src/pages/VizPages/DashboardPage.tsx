import React from 'react';
import MealTimelinePage from './MealTimelinePage';

export const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MealTimelinePage />
    </div>
  );
};

export default DashboardPage;

import React from "react";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  showRightPanel?: boolean;
  rightPanelContent?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  subtitle,
  showSidebar = false,
  sidebarContent,
  showRightPanel = false,
  rightPanelContent,
}) => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* Header with bottom decoration */}
      <div className="relative">
        <Header title={title} subtitle={subtitle} />
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Subtle shadow */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#FF9F1C]/10 to-transparent" />
          
          {/* Optional: Decorative line with dots */}
          <div className="h-[3px] flex justify-center space-x-1 px-4 bg-gradient-to-r from-transparent via-white/80 to-transparent">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-[#FF9F1C]/30 mt-1"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area with top decoration */}
      <div className="flex-1 flex relative">
        {/* Optional: Top highlight */}
        <div 
          className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/50 to-transparent pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />

        {/* Left Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white/80 shadow-lg flex-shrink-0 overflow-y-auto backdrop-blur-sm">
            {sidebarContent}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">{children}</div>

        {/* Right Panel */}
        {showRightPanel && (
          <div className="w-96 bg-white/80 shadow-lg flex-shrink-0 overflow-y-auto backdrop-blur-sm">
            {rightPanelContent}
          </div>
        )}
      </div>
    </div>
  );
};
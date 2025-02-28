import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../assets/LOGO.svg";

interface HeaderProps {
  title: string;
  subtitle: string;
}

interface NavigationItem {
  title: string;
  text: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: "Food Preferences",
    text: "Set your dietary preferences and restrictions.",
    path: "/food-preferences",
  },
  {
    title: "Meal Plan Calendar",
    text: "View and customize your weekly meal.",
    path: "/meal-plan",
  },
];

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={
        {
          "--thickness": "4px",
        } as React.CSSProperties
      }
    >
      {/* Backdrop layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          height: "200%",
          WebkitBackdropFilter: "blur(16px)",
          backdropFilter: "blur(16px)",
          background:
            "linear-gradient(to bottom, hsl(33deg 100% 95%), transparent 50%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0% 50%, transparent 50% 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0% 50%, transparent 50% 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          WebkitBackdropFilter: "blur(12px) brightness(0.96)",
          backdropFilter: "blur(12px) brightness(0.96)",
          background: "hsla(33deg, 100%, 95%, 0.1)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0, black var(--thickness), transparent var(--thickness))",
          maskImage:
            "linear-gradient(to bottom, black 0, black var(--thickness), transparent var(--thickness))",
        }}
      />

      {/* Header Content */}
      <div className="relative px-8 py-1 flex items-center justify-between bg-gradient-to-b from-white/80 to-white/60">
        {/* Logo and Title Section */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="group relative">
            <div className="relative p-2 rounded-xl transform group-hover:scale-105 transition-transform">
              <img src={Logo} alt="Logo" className="h-12 w-12" />
            </div>
          </Link>

          {/* <div className="h-12 w-px bg-[#FF9F1C]/20" /> */}

          <div>
            <h1 className="text-2xl font-bold text-[#FF9F1C]">{title}</h1>
            <p className="text-sm font-medium text-[#1A1A1A]/70">{subtitle}</p>
          </div>
        </div>

        {/* Navigation and Profile Section */}
        <div className="flex items-center space-x-8">
          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  ${
                    location.pathname === item.path
                      ? "bg-[#FFE6C9]/80 text-[#FF9F1C]"
                      : "hover:bg-[#FFE6C9]/50 text-[#1A1A1A]"
                  }`}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative rounded-xl p-1.5 hover:bg-[#FFE6C9]/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzzwKn9OLJK-HYY0fCCMiqwA7Pn1Pr5AW66g&s"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 py-2 bg-white/90 backdrop-blur-lg rounded-xl shadow-lg"
                >
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#FFE6C9]/50"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      console.log("Logout clicked");
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#FFE6C9]/50"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

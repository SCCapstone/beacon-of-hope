import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../assets/LOGO.svg";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

const BACKEND_URL = "http://127.0.0.1:8000";

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
  const userData = useSelector((state: RootState) => state.user.user);
  const isGuest = userData?._id === "67ee9325af31921234bf1241";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30"
      style={{ "--thickness": "4px" } as React.CSSProperties}
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
          {!isGuest ? 
          <Link to="/home" className="group relative">
            <div className="relative p-2 rounded-xl transform group-hover:scale-105 transition-transform">
              <img src={Logo} alt="Logo" className="h-12 w-12" />
            </div>
          </Link>
          :
          <div className="relative p-2 rounded-xl transform group-hover:scale-105 transition-transform">
              <img src={Logo} alt="Logo" className="h-12 w-12" />
          </div>
          }

          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-[1.75vw] font-bold bg-gradient-to-r from-pink-900 to-orange-400 bg-clip-text text-transparent">{title}</h1>
              <p className="text-[.8vw] font-medium text-[#1A1A1A]/70">{subtitle}</p>
            </div>
            <div className="text-[1vw] font-medium text-[#1A1A1A]">
              {!isGuest
                ? `Welcome, ${userData?.first_name}!`
                : "You are currently in Guest Mode. Log In to access more"}
            </div>
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
                className={`px-6 py-3 rounded-xl text-[.8vw] font-medium transition-all duration-300
                  ${
                    location.pathname === item.path
                      ? "bg-gradient-to-r from-orange-200 to-pink-900 text-[#FFFFFF] transition duration-200 ease-in-out transform hover:-translate-y-1 relative overflow-hidden"
                      : "hover:bg-gradient-to-r from-orange-200 to-pink-900 hover:text-white text-[#1A1A1A] transition duration-200 ease-in-out transform hover:-translate-y-1 relative overflow-hidden"
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
              className="relative rounded-xl p-1 hover:bg-gradient-to-r from-pink-100 to-orange-100 hover:text-white transition-colors"
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
                  className="absolute right-0 mt-2 w-48 py-2 bg-white/90 rounded-xl shadow-lg"
                >
                  {!isGuest && (
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r from-orange-200 to-pink-900 hover:text-white transition-colors"
                    >
                      Settings
                    </Link>
                  )}
                  <button
  onClick={async () => {
    if (isGuest) {
      window.location.href = "/";  
  
      try {
        await fetch(`${BACKEND_URL}/beacon/user/exit-default`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userData._id }),
        });
      } catch (error) {
        console.error("Error while exiting guest mode:", error);
      }
    } else {
      window.location.href = "/"; 
  
      try {
        await fetch(`${BACKEND_URL}/beacon/user/logout-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userData._id }),
        });
      } catch (error) {
        console.error("Error while logging out user:", error);
      }
    }
  }}
  
  className="block w-full text-left px-4 py-2 text-sm text-gray-700 transition-colors"
>
  {isGuest ? "Exit Guest Mode" : "Logout"}
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

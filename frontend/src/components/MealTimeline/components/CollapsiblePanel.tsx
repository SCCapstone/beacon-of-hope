import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsiblePanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  subtitle,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-[#FFE6C9] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#FFE6C9]/20 transition-colors"
      >
        <div>
          <h3 className="text-lg font-semibold text-[#FF9F1C]">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
          )}
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="w-5 h-5 text-[#FF9F1C]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-[#FFE6C9]/50 bg-white/40">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

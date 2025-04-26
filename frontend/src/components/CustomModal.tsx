import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Define size options
type ModalSize = "small" | "medium" | "large" | "xlarge";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string | React.ReactNode; // Make message optional if children is used
  children?: React.ReactNode; // Children prop for more complex content
  type?: "info" | "success" | "error" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void; // Often the same as onClose
  hideCancelButton?: boolean; // Option to hide cancel for info/error/success
  size?: ModalSize;
}

export const CustomModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message, // Keep message for simple text modals
  children, // Use children for complex JSX like the recipe
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  hideCancelButton = false,
  size = "medium",
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    // onClose(); // Let parent decide whether to close on confirm
  };

  const handleCancel = () => {
    onCancel?.();
    onClose(); // Always close on cancel
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "error":
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case "confirm":
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />; // Or a question mark icon
      case "info":
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case "error":
      case "confirm": // Make confirm potentially destructive visually
        // Use confirmText to decide button color for confirm type
        if (
          confirmText?.toLowerCase().includes("delete") ||
          confirmText?.toLowerCase().includes("remove")
        ) {
          return "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600";
        }
        return "bg-[#8B4513] hover:bg-[#A0522D] focus-visible:outline-[#8B4513]"; // Default confirm is primary color
      case "success":
        return "bg-green-600 hover:bg-green-700 focus-visible:outline-green-600";
      case "info":
      default:
        return "bg-[#8B4513] hover:bg-[#A0522D] focus-visible:outline-[#8B4513]"; // Primary color
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "max-w-sm";
      case "large":
        return "max-w-lg";
      case "xlarge":
        return "max-w-xl";
      case "medium":
      default:
        return "max-w-md";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleOverlayClick}
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative bg-white rounded-lg shadow-xl w-full ${getSizeClass()} mx-4 flex flex-col max-h-[90vh]`}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-start justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getIcon()}
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A0522D]"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Body (Scrollable) */}
            {/* Use children first if provided, otherwise fallback to message */}
            <div className="flex-grow overflow-y-auto p-6 text-sm text-gray-600">
              {children ? (
                children
              ) : typeof message === "string" ? (
                <p>{message}</p>
              ) : (
                message
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex flex-row-reverse items-center justify-start px-6 py-4 bg-gray-50 border-t border-gray-200 space-x-3 space-x-reverse">
              {/* Confirm Button Logic */}
              {(type === "confirm" || onConfirm) && ( // Show if confirm type OR if onConfirm is provided
                <button
                  type="button"
                  className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${getConfirmButtonClass()}`}
                  onClick={handleConfirm}
                >
                  {confirmText}
                </button>
              )}
              {/* OK Button Logic (only if no confirm button shown) */}
              {type !== "confirm" && !onConfirm && (
                <button
                  type="button"
                  className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${getConfirmButtonClass()}`}
                  onClick={onClose} // Simple close action
                >
                  OK
                </button>
              )}
              {/* Cancel Button Logic */}
              {(type === "confirm" || onCancel) &&
                !hideCancelButton && ( // Show if confirm type OR if onCancel provided (and not hidden)
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors duration-150"
                    onClick={handleCancel}
                  >
                    {cancelText}
                  </button>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

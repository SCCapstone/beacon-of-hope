import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  type?: "info" | "success" | "error" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void; // Often the same as onClose
  hideCancelButton?: boolean; // Option to hide cancel for info/error/success
}

export const CustomModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  hideCancelButton = false,
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    // onClose(); // Keep open until action completes? Or close immediately? Let parent decide.
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
        return "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600";
      case "success":
        return "bg-green-600 hover:bg-green-700 focus-visible:outline-green-600";
      case "info":
      default:
        return "bg-[#8B4513] hover:bg-[#A0522D] focus-visible:outline-[#8B4513]"; // Primary color
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
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
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
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

            {/* Body */}
            <div className="p-6 text-sm text-gray-600">
              {typeof message === "string" ? <p>{message}</p> : message}
            </div>

            {/* Footer */}
            <div className="flex flex-row-reverse items-center justify-start px-6 py-4 bg-gray-50 border-t border-gray-200 space-x-3 space-x-reverse">
              {type === "confirm" && onConfirm && (
                <button
                  type="button"
                  className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${getConfirmButtonClass()}`}
                  onClick={handleConfirm}
                >
                  {confirmText}
                </button>
              )}
              {/* Show generic "OK" for info/success/error if confirm isn't defined */}
              {type !== "confirm" && !onConfirm && (
                <button
                  type="button"
                  className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${getConfirmButtonClass()}`}
                  onClick={onClose} // Simple close action
                >
                  OK
                </button>
              )}
              {/* Show Cancel button for confirm, or if explicitly not hidden */}
              {type === "confirm" && !hideCancelButton && (
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

import React, { useEffect } from "react";
import { CheckCircle, Award, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  variant?: "success" | "badge" | "error";
}

export const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onClose,
  variant = "success",
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const IconComponent =
    variant === "error"
      ? AlertCircle
      : variant === "badge"
        ? Award
        : CheckCircle;
  const iconColor =
    variant === "error"
      ? "#ef4444"
      : variant === "badge"
        ? "#f59e0b"
        : "#10b981";

  return (
    <div
      className="toast-notification"
    >
      <IconComponent size={18} color={iconColor} />
      <span
        style={{ color: "white", fontSize: "14px", fontWeight: 500, flex: 1 }}
      >
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#a0a0b0",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 540px;
          left: auto;
          transform: none;
          background: rgba(24, 24, 27, 0.98);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          z-index: 9999;
          animation: slideDown 0.3s ease-out;
          min-width: 200px;
          max-width: 90vw;
        }

        @keyframes slideDown {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Мобильная версия: сверху по центру, более контрастное */
        @media (max-width: 768px) {
          .toast-notification {
            top: 16px;
            right: 16px;
            left: 16px;
            min-width: auto;
            background: rgba(10, 10, 12, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
            padding: 12px 16px;
          }

          @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
};
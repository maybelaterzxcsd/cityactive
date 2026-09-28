import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Trophy } from 'lucide-react';
import './Toast.css';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  variant?: 'success' | 'badge'; // <-- НОВОЕ
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  variant = 'success' 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const Icon = variant === 'badge' ? Trophy : CheckCircle;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`toast toast--${variant}`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="toast__icon">
            <Icon size={20} />
          </div>
          <span className="toast__message">{message}</span>
          <button className="toast__close" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
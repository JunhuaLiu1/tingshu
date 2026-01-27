import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top' | 'center' | 'bottom';

interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number;
  position?: ToastPosition;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<(ToastConfig & { visible: boolean }) | null>(null);

  const showToast = useCallback((config: ToastConfig) => {
    setToast({ ...config, visible: true });
    
    const duration = config.duration || 2000;
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast?.visible && (
        <Toast
          type={toast.type}
          message={toast.message}
          position={toast.position || 'bottom'}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

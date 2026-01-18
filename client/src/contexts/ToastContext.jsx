import { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext();

export const TOAST_TYPES = {
  success: 'success',
  error: 'error',
  info: 'info',
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { type = TOAST_TYPES.info, duration = 4000, title } = {}) => {
      const id = createId();

      setToasts((current) => [...current, { id, message, type, title }]);

      if (duration !== Infinity) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} pointer-events-auto`}
            role="status"
            aria-live="polite"
          >
            <div className="flex justify-between items-start space-x-4">
              <div>
                {toast.title && (
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {toast.title}
                  </p>
                )}
                <p className="text-sm text-gray-800">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

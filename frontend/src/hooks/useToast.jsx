import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

/**
 * toast.success('Invoice created'), toast.error(...), toast.info(...)
 * Optional second argument: a detail line.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, title, detail) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, type, title, detail }]);
      setTimeout(() => dismiss(id), type === 'error' ? 5500 : 3800);
    },
    [dismiss],
  );

  const api = {
    success: (t, d) => push('success', t, d),
    error: (t, d) => push('error', t, d),
    info: (t, d) => push('info', t, d),
    warning: (t, d) => push('warning', t, d),
  };

  return <ToastContext.Provider value={{ toast: api, toasts, dismiss }}>{children}</ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext).toast;
export const useToastState = () => useContext(ToastContext);

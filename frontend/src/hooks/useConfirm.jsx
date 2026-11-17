// Promise-based confirmation dialog:  if (await confirm({ title, message })) { ... }

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState({ confirmLabel: 'Delete', tone: 'danger', ...opts });
      }),
    [],
  );

  const close = (result) => {
    resolver.current?.(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog {...state} onCancel={() => close(false)} onConfirm={() => close(true)} />}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);

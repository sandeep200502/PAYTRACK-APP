// Tiny hash router (no dependency). Keeps the current page on refresh and
// supports the browser back button: #/invoices/inv_3?status=overdue

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const RouterContext = createContext(null);

function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/dashboard';
  const [path, qs = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  const segments = path.split('/').filter(Boolean);
  return { path, segments, query };
}

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(parse);

  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to) => {
    if (`#${to}` === window.location.hash) return;
    window.location.hash = to;
  }, []);

  return <RouterContext.Provider value={{ ...route, navigate }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

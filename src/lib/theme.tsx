import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'cwos-theme';

const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const cur = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    setTheme(cur);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

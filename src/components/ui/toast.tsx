import { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: number; text: string; tone: 'default' | 'error' };
const Ctx = createContext<(text: string, tone?: 'default' | 'error') => void>(() => {});

let seq = 0;

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: 'default' | 'error' = 'default') => {
    const id = ++seq;
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[100] flex flex-col items-center gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              'rounded-[11px] px-[18px] py-[11px] text-[13px] font-semibold shadow-card ' +
              (t.tone === 'error' ? 'bg-crit text-white' : 'bg-ink text-ground')
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

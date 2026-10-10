'use client';

import { useState, createContext, useContext } from 'react';

type View = 'cards' | 'list';
const ViewContext = createContext<View>('cards');
export const useView = () => useContext(ViewContext);

export function ViewToggleProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>('cards');
  return (
    <div>
      <div className="flex justify-end gap-1 pb-4">
        {(['cards', 'list'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              view === v ? 'bg-brand-600 text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {v === 'cards' ? 'Tarjetas' : 'Lista'}
          </button>
        ))}
      </div>
      <ViewContext.Provider value={view}>{children}</ViewContext.Provider>
    </div>
  );
}

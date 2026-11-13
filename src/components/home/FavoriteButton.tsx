'use client';

import { useEffect, useState } from 'react';
import { FAVORITES_KEY, parseFavoriteSlugs, toggleFavorite } from '@/lib/favorites';

export function FavoriteButton({ slug, name, inline = false }: { slug: string; name: string; inline?: boolean }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const read = () => {
      try { setIsFavorite(parseFavoriteSlugs(localStorage.getItem(FAVORITES_KEY)).includes(slug)); }
      catch { setIsFavorite(false); }
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, [slug]);

  const onToggle = () => {
    try {
      const current = parseFavoriteSlugs(localStorage.getItem(FAVORITES_KEY));
      const updated = toggleFavorite(current, slug);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      setIsFavorite(updated.includes(slug));
    } catch {
      // Private browsing/blocked storage: a local UI toggle still works.
      setIsFavorite((value) => !value);
    }
  };

  return (
    <button
      type="button"
      aria-label={isFavorite ? `Quitar ${name} de favoritos` : `Añadir ${name} a favoritos`}
      aria-pressed={isFavorite}
      title={isFavorite ? 'Quitar de favoritos' : 'Guardar favorito en este navegador'}
      onClick={onToggle}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-pulse-600 transition-colors hover:bg-pulse-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse-500 ${inline ? "relative" : "absolute right-3 top-3 z-10 sm:right-4 sm:top-4"}`}
    >
      <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true"
        fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 2.5 3 6.12 6.75.98-4.88 4.76 1.16 6.72L12 17.91l-6.03 3.17 1.15-6.72-4.87-4.76 6.74-.98L12 2.5Z" />
      </svg>
    </button>
  );
}

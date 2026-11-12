'use client';

import Image from 'next/image';
import { useState } from 'react';
import { logoForService } from '@/lib/brand-logos';

const BRAND_TONES: Record<string, { background: string; foreground: string }> = {
  'telecomunicaciones': { background: 'bg-sky-50 dark:bg-sky-950', foreground: 'text-sky-700 dark:text-sky-300' },
  'banca-y-pagos': { background: 'bg-emerald-50 dark:bg-emerald-950', foreground: 'text-emerald-700 dark:text-emerald-300' },
  'servicios-publicos': { background: 'bg-amber-50 dark:bg-amber-950', foreground: 'text-amber-700 dark:text-amber-300' },
  'plataformas-digitales': { background: 'bg-violet-50 dark:bg-violet-950', foreground: 'text-violet-700 dark:text-violet-300' },
};
const DEFAULT_TONE = { background: 'bg-brand-50 dark:bg-brand-900', foreground: 'text-brand-700 dark:text-brand-200' };

function monogram(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length > 1) return words.slice(0, 2).map((word) => word[0] ?? '').join('').toLocaleUpperCase('es-VE');
  return name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toLocaleUpperCase('es-VE') || 'VE';
}

/**
 * Logos are inert, locally-served PNGs with provenance recorded in docs.
 * Never hotlink a logo host from a user's browser. A broken asset falls back
 * to a descriptive monogram instead of showing the broken-image glyph.
 */
export function BrandMark({
  slug, name, categorySlug,
}: {
  slug: string;
  name: string;
  categorySlug: string;
}) {
  const [broken, setBroken] = useState(false);
  const logo = logoForService(slug);
  const tone = BRAND_TONES[categorySlug] ?? DEFAULT_TONE;

  if (logo && !broken) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2">
        <div className="flex h-[90px] w-full max-w-[174px] items-center justify-center rounded-xl bg-white p-2 sm:h-[104px] sm:max-w-[220px]">
          <Image
            src={logo}
            alt={`Logotipo identificativo de ${name}`}
            width={220}
            height={110}
            sizes="(max-width: 640px) 160px, 220px"
            unoptimized
            onError={() => setBroken(true)}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <span
        aria-label={`Identificador tipográfico de ${name}`}
        role="img"
        className={`flex h-[74px] w-[74px] items-center justify-center rounded-[20px] text-3xl font-bold tracking-tight sm:h-20 sm:w-20 ${tone.background} ${tone.foreground}`}
      >
        {monogram(name)}
      </span>
      <span className={`line-clamp-2 max-w-full text-center text-xs font-semibold sm:text-sm ${tone.foreground}`}>
        {name}
      </span>
    </div>
  );
}

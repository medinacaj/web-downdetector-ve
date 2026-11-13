'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
 * Logos are locally-served PNG/SVG assets with provenance recorded in docs.
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

  // A reused card must retry the new service's asset after a prior image failed.
  useEffect(() => {
    setBroken(false);
  }, [logo]);
  const tone = BRAND_TONES[categorySlug] ?? DEFAULT_TONE;

  if (logo && !broken) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-full w-full max-w-[175px] items-center justify-center rounded-lg bg-white p-1">
          <Image
            src={logo}
            alt={`Logotipo identificativo de ${name}`}
            width={220}
            height={110}
            sizes="(max-width: 640px) 160px, 220px"
            unoptimized
            onError={() => setBroken(true)}
            className="h-full max-h-[72px] w-full object-contain object-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <span
        aria-label={`Identificador tipográfico de ${name}`}
        role="img"
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold tracking-tight ${tone.background} ${tone.foreground}`}
      >
        {monogram(name)}
      </span>
    </div>
  );
}

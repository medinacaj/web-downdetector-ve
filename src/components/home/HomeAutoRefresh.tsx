'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Refresh server-ranked cards without forcing a full-page navigation.
 * Skips background tabs and active forms to avoid interrupting user input.
 */
export function HomeAutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden || document.querySelector('dialog[open]')) return;
      const focused = document.activeElement;
      if (focused?.matches('input, textarea, select, [contenteditable="true"]')) return;
      router.refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [router]);
  return null;
}

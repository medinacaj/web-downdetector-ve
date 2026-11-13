import { describe, expect, it } from 'vitest';
import { FAVORITES_CHANGE_EVENT, FAVORITES_KEY, parseFavoriteSlugs, toggleFavorite } from '@/lib/favorites';

describe('local service favorites', () => {
  it('uses a scoped storage key, not a user account or a backend', () => {
    expect(FAVORITES_KEY).toBe('pulsove:favorites:v1');
    expect(FAVORITES_CHANGE_EVENT).toBe('pulsove:favorites:change');
  });

  it('defaults to an empty list and tolerates private browsing corruption', () => {
    expect(parseFavoriteSlugs(null)).toEqual([]);
    expect(parseFavoriteSlugs('{bad')).toEqual([]);
    expect(parseFavoriteSlugs('{}')).toEqual([]);
  });

  it('validates and deduplicates slugs to prevent arbitrary stored payloads', () => {
    expect(parseFavoriteSlugs(JSON.stringify([
      'cantv', 'cantv', 'banco-de-venezuela',
      'https://other.example/', '<script>', 3, null, 'A'.repeat(300),
    ]))).toEqual(['cantv', 'banco-de-venezuela']);
  });

  it('adds and removes favorites without duplicate entries', () => {
    const once = toggleFavorite([], 'cantv');
    expect(once).toEqual(['cantv']);
    expect(toggleFavorite(once, 'cantv')).toEqual([]);
    expect(toggleFavorite(once, 'movistar')).toEqual(['cantv', 'movistar']);
    expect(toggleFavorite(once, 'bad\nslug')).toEqual(['cantv']);
  });

  it('caps storage size', () => {
    const slugs = Array.from({ length: 100 }, (_, i) => `service-${i}`);
    expect(parseFavoriteSlugs(JSON.stringify(slugs))).toHaveLength(80);
    expect(toggleFavorite(slugs.slice(0, 80), 'extra-service')).toHaveLength(80);
  });
});

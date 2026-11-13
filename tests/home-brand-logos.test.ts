import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOME_BRAND_LOGOS, logoForService } from '@/lib/brand-logos';

describe('homepage editorial brand assets', () => {
  it('renders explicit local images for researched services, not external trackers', () => {
    const keys = Object.keys(HOME_BRAND_LOGOS);
    expect(keys.length).toBe(167);
    for (const [slug, path] of Object.entries(HOME_BRAND_LOGOS)) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(path).toMatch(/^\/brands\/[a-z0-9-]+\.(png|svg)$/);
      expect(path).toBe(logoForService(slug));
    }
  });

  it('supports fallback for missing/unverified brands and unsafe slug names', () => {
    expect(logoForService('sistema-patria')).toBeNull();
    expect(logoForService('mercantil')).toBeNull();
    expect(logoForService('seniat')).toBeNull();
    expect(logoForService('__proto__')).toBeNull();
    expect(logoForService('https://attacker.invalid/logo.svg')).toBeNull();
  });

  it('keeps every referenced logo local, nonempty and in an expected safe format', () => {
    for (const path of Object.values(HOME_BRAND_LOGOS)) {
      const file = join(process.cwd(), 'public', path.slice(1));
      expect(existsSync(file), `Missing asset: ${path}`).toBe(true);
      const data = readFileSync(file);
      expect(data.length).toBeGreaterThan(100);
      expect(data.length).toBeLessThan(350_000);
      if (path.endsWith('.png')) {
        expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      } else {
        const svg = data.toString('utf8');
        expect(svg).toMatch(/^<svg\s/);
        expect(svg).toMatch(/<(?:path|rect|polygon|circle|g|ellipse|line)\b/);
        expect(svg).not.toMatch(/<script|<foreignObject|<image|onload=|href=/i);
      }
    }
  });
});

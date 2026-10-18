import { describe, expect, it } from 'vitest';
import { canonical, indexable, siteUrl } from '../src/lib/seo';

describe('configuración SEO no indexable por defecto', () => {
  it('exige URL HTTPS pública y activación explícita', () => {
    expect(indexable({ PUBLIC_INDEXABLE: 'true' })).toBe(false);
    expect(indexable({ SITE_URL: 'https://ejemplo.org/', PUBLIC_INDEXABLE: 'false' })).toBe(false);
    expect(indexable({ SITE_URL: 'https://ejemplo.org/', PUBLIC_INDEXABLE: 'true' })).toBe(true);
  });
  it('rechaza URLs de desarrollo, http y rutas externas', () => {
    for (const url of ['http://ejemplo.org', 'https://localhost', 'https://ejemplo.org/sub/', 'https://ejemplo.org?q=1']) {
      expect(siteUrl({ SITE_URL: url })).toBeNull();
    }
  });
  it('genera canonical sin query ni anidación en host ajeno', () => {
    const env = { SITE_URL: 'https://ejemplo.org', PUBLIC_INDEXABLE: 'true' };
    expect(canonical('/servicios', env)).toBe('https://ejemplo.org/servicios');
    expect(canonical('//malicioso.test', env)).toBeNull();
    expect(canonical('/?q=texto', env)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { topIssuesForPeriod, type IssueBreakdownRow } from '../src/lib/queries/issue-breakdown-series';

describe('Top-3 de reportes ciudadanos por tipo', () => {
  const rows: IssueBreakdownRow[] = [
    { name: 'Acceso', last24h: 5, last7d: 6, last30d: 30 },
    { name: 'Aplicación', last24h: 4, last7d: 40, last30d: 50 },
    { name: 'Internet', last24h: 1, last7d: 5, last30d: 60 },
    { name: 'Otros', last24h: 1, last7d: 1, last30d: 10 },
  ];

  it('ordena por periodo y usa todas las categorías para el denominador', () => {
    const daily = topIssuesForPeriod(rows, '24h');
    expect(daily.total).toBe(11);
    expect(daily.top.map((r) => r.name)).toEqual(['Acceso', 'Aplicación', 'Internet']);
    expect(daily.top.map((r) => r.sharePercent)).toEqual([45, 36, 9]);
    expect(daily.top.reduce((n, row) => n + row.reports, 0)).toBe(10);

    const weekly = topIssuesForPeriod(rows, '7d');
    expect(weekly.total).toBe(52);
    expect(weekly.top.map((r) => r.name)).toEqual(['Aplicación', 'Acceso', 'Internet']);

    const monthly = topIssuesForPeriod(rows, '30d');
    expect(monthly.total).toBe(150);
    expect(monthly.top.map((r) => r.name)).toEqual(['Internet', 'Aplicación', 'Acceso']);
  });

  it('no inventa datos cuando no hay reportes y omite categorías vacías', () => {
    expect(topIssuesForPeriod([], '24h')).toEqual({ total: 0, top: [] });
    expect(topIssuesForPeriod([{ name: 'Sin reportes', last24h: 0, last7d: 0, last30d: 0 }], '30d'))
      .toEqual({ total: 0, top: [] });
  });

  it('rechaza conteos negativos, no finitos y usa un orden estable en empates', () => {
    const unusual: IssueBreakdownRow[] = [
      { name: 'B', last24h: 2.9, last7d: 0, last30d: 0 },
      { name: 'A', last24h: 2, last7d: 0, last30d: 0 },
      { name: 'Z', last24h: -8, last7d: 0, last30d: 0 },
      { name: 'X', last24h: Number.NaN, last7d: 0, last30d: 0 },
      { name: ' ', last24h: 10, last7d: 10, last30d: 10 },
    ];
    expect(topIssuesForPeriod(unusual, '24h')).toEqual({
      total: 4,
      top: [
        { name: 'A', reports: 2, sharePercent: 50 },
        { name: 'B', reports: 2, sharePercent: 50 },
      ],
    });
  });
});

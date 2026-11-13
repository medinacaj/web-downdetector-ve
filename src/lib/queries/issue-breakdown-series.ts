/** Conteos por tipo de falla sin identidades, comentarios ni geolocalización. */
export type IssueBreakdownPeriod = '24h' | '7d' | '30d';

export interface IssueBreakdownRow {
  name: string;
  last24h: number;
  last7d: number;
  last30d: number;
}

export interface RankedIssue {
  name: string;
  reports: number;
  sharePercent: number;
}

const COUNT_FIELD: Record<IssueBreakdownPeriod, keyof Pick<IssueBreakdownRow, 'last24h' | 'last7d' | 'last30d'>> = {
  '24h': 'last24h',
  '7d': 'last7d',
  '30d': 'last30d',
};

/**
 * Rankings and percentages reflect ALL valid report categories in the selected
 * period, even though only the three leaders are shown. Never fabricate a
 * category when no reports exist.
 */
export function topIssuesForPeriod(rows: readonly IssueBreakdownRow[], period: IssueBreakdownPeriod): {
  total: number;
  top: RankedIssue[];
} {
  const key = COUNT_FIELD[period];
  const normalized = rows.map((row) => ({
    name: row.name,
    reports: Number.isFinite(row[key]) ? Math.max(0, Math.trunc(row[key])) : 0,
  })).filter((row) => row.name.trim().length > 0);
  const total = normalized.reduce((sum, row) => sum + row.reports, 0);
  const top = normalized.filter((row) => row.reports > 0)
    .sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name, 'es'))
    .slice(0, 3)
    .map((row) => ({
      ...row,
      sharePercent: total > 0 ? Math.round((row.reports / total) * 100) : 0,
    }));
  return { total, top };
}

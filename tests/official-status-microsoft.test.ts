import { describe, expect, it } from 'vitest';
import { MICROSOFT_FEEDS, parseMicrosoftRss } from '@/lib/official-status/microsoft-rss';

const checkedAt = '2026-11-12T23:20:00.000Z';
const [m365, power, azure] = MICROSOFT_FEEDS;

function rss(title: string, body: string): string {
  return '<?xml version="1.0"?><rss version="2.0"><channel><title>' + title +
    '</title><lastBuildDate>Thu, 12 Nov 2026 23:16:00 Z</lastBuildDate>' + body + '</channel></rss>';
}

function item(status: string, description = 'Provider update', date = 'Thu, 12 Nov 2026 23:06:31 Z') {
  return '<item><guid>case-123</guid><title>Microsoft Admin Center</title><description>' +
    description + '</description><pubDate>' + date + '</pubDate><status>' + status + '</status></item>';
}

describe('Microsoft official RSS monitoring', () => {
  it('uses fixed HTTPS allowlisted endpoints only', () => {
    expect(MICROSOFT_FEEDS).toHaveLength(3);
    for (const feed of MICROSOFT_FEEDS) {
      expect(feed.feedUrl).toMatch(/^https:\/\//);
      expect(new URL(feed.feedUrl).hostname).toMatch(/(^|\.)microsoft$|(^|\.)microsoft\.com$/);
      expect(feed.statusUrl).toMatch(/^https:\/\//);
    }
  });

  it('recognizes Microsoft 365 degradation and safely removes embedded HTML', () => {
    const xml = rss(m365.expectedTitle, item('ServiceDegradation',
      '&lt;div&gt;Users may be unable to connect.&lt;/div&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
    const parsed = parseMicrosoftRss(m365, xml, checkedAt);
    expect(parsed.status).toBe('degraded');
    expect(parsed.summary).toContain('Users may be unable to connect.');
    expect(parsed.summary).not.toContain('<script>');
    expect(parsed.publishedAt).toBe('2026-11-12T23:06:31.000Z');
    expect(parsed.incidentId).toBe('case-123');
  });

  it('labels Power Platform admin as available without implying apps are healthy', () => {
    const result = parseMicrosoftRss(power, rss(power.expectedTitle, item('Available')), checkedAt);
    expect(result.status).toBe('available');
    expect(result.scope).toMatch(/no acredita la disponibilidad/);
  });

  it('never converts an empty Azure RSS to operational', () => {
    const result = parseMicrosoftRss(azure, rss(azure.expectedTitle, ''), checkedAt);
    expect(result.status).toBe('no_public_incidents');
    expect(result.summary).toBeNull();
    expect(result.updatedAt).toBe('2026-11-12T23:16:00.000Z');
  });

  it('treats an Azure incident entry as reported, not as a confirmed outage', () => {
    const result = parseMicrosoftRss(azure, rss(azure.expectedTitle,
      '<item><guid>az-11</guid><title>Azure public incident</title><pubDate>Thu, 12 Nov 2026 23:06:31 Z</pubDate></item>'), checkedAt);
    expect(result.status).toBe('incident_reported');
    expect(result.incidentId).toBe('az-11');
  });

  it('sorts entries by latest publication time', () => {
    const result = parseMicrosoftRss(m365, rss(m365.expectedTitle,
      item('Available', 'old', 'Wed, 11 Nov 2026 10:00:00 Z') +
      item('ServiceInterruption', 'new', 'Thu, 12 Nov 2026 20:00:00 Z')), checkedAt);
    expect(result.status).toBe('interrupted');
    expect(result.summary).toBe('new');
  });

  it('fails closed for unknown states, wrong channels, invalid RSS and entity declarations', () => {
    expect(parseMicrosoftRss(m365, rss(m365.expectedTitle, item('UnknownNewState')), checkedAt).status).toBe('unknown');
    expect(parseMicrosoftRss(m365, rss('Unrelated', item('Available')), checkedAt).status).toBe('unknown');
    expect(parseMicrosoftRss(m365, '<html>not rss</html>', checkedAt).status).toBe('unknown');
    expect(parseMicrosoftRss(m365, '<!DOCTYPE rss><rss><channel></channel></rss>', checkedAt).status).toBe('unknown');
  });

  it('does not interpret a missing Microsoft 365 item as available', () => {
    expect(parseMicrosoftRss(m365, rss(m365.expectedTitle, ''), checkedAt).status).toBe('unknown');
  });
});

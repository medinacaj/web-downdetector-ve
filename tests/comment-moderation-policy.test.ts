import { describe, expect, it } from 'vitest';
import {
  COMMENT_RETENTION,
  commentRetentionCutoffs,
  parseCommentModerationCommand,
} from '@/lib/comments/moderation-policy';

const id = '12345678-1234-4234-9234-123456789abc';

describe('Server-only comment moderation policy', () => {
  it('accepts listing pending, approved or rejected comments', () => {
    expect(parseCommentModerationCommand(['list'])).toEqual({ action: 'list', status: 'pending' });
    expect(parseCommentModerationCommand(['list', 'approved'])).toEqual({ action: 'list', status: 'approved' });
    expect(parseCommentModerationCommand(['list', 'rejected'])).toEqual({ action: 'list', status: 'rejected' });
  });
  it('allows a UUID transition, but removal requires an explicit flag', () => {
    expect(parseCommentModerationCommand(['approve', id])).toEqual({ action: 'approve', id });
    expect(parseCommentModerationCommand(['reject', id])).toEqual({ action: 'reject', id });
    expect(() => parseCommentModerationCommand(['remove', id])).toThrow();
    expect(parseCommentModerationCommand(['remove', id, '--confirm']))
      .toEqual({ action: 'remove', id });
  });
  it('defaults expired-comment cleanup to a no-op preview', () => {
    expect(parseCommentModerationCommand(['prune'])).toEqual({ action: 'prune', confirm: false });
    expect(parseCommentModerationCommand(['prune', '--confirm']))
      .toEqual({ action: 'prune', confirm: true });
  });
  it('rejects malformed IDs, unknown status, extra flags and unsafe commands', () => {
    for (const args of [
      [], ['remove', 'bad-id', '--confirm'], ['remove', id, '--yes'],
      ['approve', id, '--confirm'], ['approve', 'a'], ['list', 'all'],
      ['list', 'pending', 'extra'], ['prune', '--force'], ['prune', '--confirm', 'extra'],
      ['delete-all'], ['remove', id, '--confirm', 'more'],
    ]) {
      expect(() => parseCommentModerationCommand(args), args.join(' ')).toThrow();
    }
  });
  it('retains approved content while bounding abandoned and rejected items', () => {
    const now = new Date('2026-11-13T12:00:00Z');
    const cutoffs = commentRetentionCutoffs(now);
    expect(COMMENT_RETENTION.pendingDays).toBe(30);
    expect(COMMENT_RETENTION.rejectedDays).toBe(7);
    expect(COMMENT_RETENTION.maxPruneBatch).toBe(100);
    expect(cutoffs.pending.toISOString()).toBe('2026-10-14T12:00:00.000Z');
    expect(cutoffs.rejected.toISOString()).toBe('2026-11-06T12:00:00.000Z');
  });
});

export const COMMENT_RETENTION = {
  pendingDays: 30,
  rejectedDays: 7,
  maxPruneBatch: 100,
} as const;

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const STATUSES = ['pending', 'approved', 'rejected'] as const;
export type CommentModerationStatus = typeof STATUSES[number];

export type CommentModerationCommand =
  | { action: 'list'; status: CommentModerationStatus }
  | { action: 'approve' | 'reject'; id: string }
  | { action: 'remove'; id: string }
  | { action: 'prune'; confirm: boolean };

export function parseCommentModerationCommand(args: readonly string[]): CommentModerationCommand {
  const [action, arg, confirmation] = args;
  if (action === 'list' && args.length <= 2
    && (arg === undefined || STATUSES.includes(arg as CommentModerationStatus))) {
    return { action, status: (arg ?? 'pending') as CommentModerationStatus };
  }
  if ((action === 'approve' || action === 'reject') && args.length === 2
    && typeof arg === 'string' && UUID.test(arg)) {
    return { action, id: arg };
  }
  // Explicit acknowledgement required: a typo must never delete content.
  if (action === 'remove' && args.length === 3
    && typeof arg === 'string' && UUID.test(arg) && confirmation === '--confirm') {
    return { action, id: arg };
  }
  if (action === 'prune' && (args.length === 1 || (args.length === 2 && arg === '--confirm'))) {
    return { action, confirm: arg === '--confirm' };
  }
  throw new Error(
    'Uso: comments:moderate -- list [pending|approved|rejected] | approve <UUID> | reject <UUID> | remove <UUID> --confirm | prune [--confirm]',
  );
}

export function commentRetentionCutoffs(now: Date = new Date()) {
  const day = 24 * 60 * 60 * 1000;
  return {
    pending: new Date(now.getTime() - COMMENT_RETENTION.pendingDays * day),
    rejected: new Date(now.getTime() - COMMENT_RETENTION.rejectedDays * day),
  };
}

import { z } from 'zod';

/**
 * Anonymous community discussion is separate from technical outage reports.
 * Links, email addresses and phone-like strings are held out of publication;
 * human moderation must still review every submission.
 */
export const createServiceCommentSchema = z.object({
  body: z.string().trim().min(15, 'Escribe al menos 15 caracteres.')
    .max(500, 'Máximo 500 caracteres.')
    .refine(value => !/(https?:\/\/|www\.)/i.test(value), 'No incluyas enlaces.')
    .refine(value => !/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(value), 'No incluyas correos electrónicos.')
    .refine(value => !/(?:\+?\d[\d\s()\-.]{8,}\d)/.test(value), 'No incluyas teléfonos ni identificadores numéricos.'),
  deviceSeed: z.string().min(8).max(128),
  privacyAcknowledged: z.literal(true),
});

export type CreateServiceCommentInput = z.infer<typeof createServiceCommentSchema>;

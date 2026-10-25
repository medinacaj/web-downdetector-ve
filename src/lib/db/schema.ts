import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  real,
  smallint,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const reportSourceEnum = pgEnum('report_source', ['web', 'api', 'admin']);
export const incidentStatusEnum = pgEnum('incident_status', [
  'possible', // Posible interrupción
  'detected', // Interrupción detectada
  'high_confidence', // Interrupción de alta confianza
  'confirmed', // Confirmado por el proveedor
  'recovering', // En recuperación
  'resolved', // Resuelto
]);
export const userRoleEnum = pgEnum('user_role', ['admin', 'moderator', 'user']);
export const checkTypeEnum = pgEnum('check_type', [
  'http',
  'https',
  'dns',
  'ping',
  'traceroute',
  'tls',
  'api',
]);
export const subscriptionChannelEnum = pgEnum('subscription_channel', [
  'email',
  'web_push',
  'telegram',
  'whatsapp',
]);
export const moderationActionEnum = pgEnum('moderation_action', [
  'mark_spam',
  'mark_fraudulent',
  'hide',
  'restore',
  'escalate',
]);

// ---------------------------------------------------------------------------
// Geografía
// ---------------------------------------------------------------------------
export const states = pgTable('states', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  code: varchar('code', { length: 8 }).notNull().unique(),
  // Posición en el cartograma de cuadrícula (ver components/Cartogram.tsx).
  // No son coordenadas geográficas reales — ver Parte 10 / README (limitación
  // documentada: mapa esquemático, no MapLibre + geometría real).
  gridRow: integer('grid_row').notNull(),
  gridCol: integer('grid_col').notNull(),
  geometry: jsonb('geometry'), // reservado para GeoJSON real (Fase 2)
  active: boolean('active').notNull().default(true),
});

export const municipalities = pgTable('municipalities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  stateId: uuid('state_id')
    .notNull()
    .references(() => states.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  geometry: jsonb('geometry'),
});

// ---------------------------------------------------------------------------
// Catálogo: categorías, servicios, endpoints, tipos de problema
// ---------------------------------------------------------------------------
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 32 }).notNull().default('signal'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar('slug', { length: 96 }).notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    logoUrl: text('logo_url'), // null => se usa monograma tipográfico (ver ServiceLogo.tsx)
    officialUrl: text('official_url'), // null => "pendiente de verificación" (sección 4.2)
    active: boolean('active').notNull().default(true),
    isDemo: boolean('is_demo').notNull().default(true), // dato de demostración, no verificado operativamente
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index('services_category_idx').on(t.categoryId),
  }),
);

export const serviceEndpoints = pgTable('service_endpoints', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  type: checkTypeEnum('type').notNull(),
  target: text('target').notNull(), // host o URL objetivo
  region: varchar('region', { length: 32 }).notNull().default('caracas'),
  active: boolean('active').notNull().default(false), // false por defecto: ver ENABLE_TECHNICAL_CHECKS
  frequencySeconds: integer('frequency_seconds').notNull().default(300),
  timeoutMs: integer('timeout_ms').notNull().default(5000),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const issueTypes = pgTable('issue_types', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid('category_id').references(() => categories.id),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  active: boolean('active').notNull().default(true),
});

// ---------------------------------------------------------------------------
// Reportes ciudadanos
// ---------------------------------------------------------------------------
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    issueTypeId: uuid('issue_type_id')
      .notNull()
      .references(() => issueTypes.id),
    stateId: uuid('state_id')
      .notNull()
      .references(() => states.id),
    municipalityId: uuid('municipality_id').references(() => municipalities.id),
    cityText: varchar('city_text', { length: 120 }),
    // Operador/red desde la que se reporta (brief, sección 8, campo 5) —
    // texto libre corto ("Movistar", "CANTV ABA", "WiFi Fibex"), opcional.
    networkCarrier: varchar('network_carrier', { length: 64 }),
    comment: varchar('comment', { length: 280 }),
    source: reportSourceEnum('source').notNull().default('web'),
    // Identidad pseudónima — nunca se almacena IP completa ni identificador
    // permanente. Ver lib/privacy.ts.
    anonymousHash: varchar('anonymous_hash', { length: 64 }).notNull(),
    ipPrefixHash: varchar('ip_prefix_hash', { length: 64 }).notNull(),
    confidence: real('confidence').notNull().default(0.5),
    suspicious: boolean('suspicious').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    serviceCreatedIdx: index('reports_service_created_idx').on(t.serviceId, t.createdAt),
    anonHashIdx: index('reports_anon_hash_idx').on(t.anonymousHash),
    ipPrefixIdx: index('reports_ip_prefix_idx').on(t.ipPrefixHash),
  }),
);

// ---------------------------------------------------------------------------
// Mediciones técnicas
// ---------------------------------------------------------------------------
export const technicalChecks = pgTable(
  'technical_checks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    serviceEndpointId: uuid('service_endpoint_id')
      .notNull()
      .references(() => serviceEndpoints.id, { onDelete: 'cascade' }),
    checkType: checkTypeEnum('check_type').notNull(),
    success: boolean('success').notNull(),
    latencyMs: integer('latency_ms'),
    packetLoss: real('packet_loss'),
    statusCode: integer('status_code'),
    errorCode: varchar('error_code', { length: 64 }),
    metadata: jsonb('metadata'),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    endpointCheckedIdx: index('tc_endpoint_checked_idx').on(t.serviceEndpointId, t.checkedAt),
  }),
);

// ---------------------------------------------------------------------------
// Línea base y ventanas agregadas (motor de detección)
// ---------------------------------------------------------------------------
export const baselines = pgTable(
  'baselines',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    stateId: uuid('state_id').references(() => states.id),
    weekday: smallint('weekday').notNull(), // 0=domingo .. 6=sábado (America/Caracas)
    hour: smallint('hour').notNull(), // 0..23 (America/Caracas)
    medianReports: real('median_reports').notNull().default(0),
    dispersion: real('dispersion').notNull().default(1), // MAD robusta
    sampleSize: integer('sample_size').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueBucket: uniqueIndex('baselines_unique_bucket').on(
      t.serviceId,
      t.stateId,
      t.weekday,
      t.hour,
    ),
  }),
);

export const aggregatedWindows = pgTable(
  'aggregated_windows',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    stateId: uuid('state_id').references(() => states.id),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    totalReports: integer('total_reports').notNull().default(0),
    uniqueReporters: integer('unique_reporters').notNull().default(0),
    weightedReports: real('weighted_reports').notNull().default(0),
    anomalyScore: real('anomaly_score').notNull().default(0), // 0-100
    technicalScore: real('technical_score').notNull().default(0), // 0-100
    confidence: real('confidence').notNull().default(0), // 0-100, score final ponderado
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    serviceWindowIdx: index('aw_service_window_idx').on(t.serviceId, t.windowStart),
    // Último ciclo del motor (src/lib/queries/engine.ts) y última ventana procesada
    // (lastProcessedWindowStart en src/lib/engine/cycle.ts) sin recorrer la tabla entera.
    createdAtIdx: index('aw_created_at_idx').on(t.createdAt),
    windowStartIdx: index('aw_window_start_idx').on(t.windowStart),
  }),
);

// ---------------------------------------------------------------------------
// Incidentes
// ---------------------------------------------------------------------------
export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    status: incidentStatusEnum('status').notNull().default('possible'),
    confidence: real('confidence').notNull().default(0),
    severity: varchar('severity', { length: 16 }).notNull().default('moderate'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    peakAt: timestamp('peak_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    summary: text('summary'),
    officiallyConfirmed: boolean('officially_confirmed').notNull().default(false),
    sourceUrl: text('source_url'),
    createdBy: uuid('created_by'), // null => generado automáticamente por el motor
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    serviceStatusIdx: index('incidents_service_status_idx').on(t.serviceId, t.status),
    // Sirve GET /api/incidents (todos los servicios, filtrado por estado,
    // ordenado por inicio) — el índice anterior antepone service_id y no
    // ayuda a esa consulta.
    statusStartedIdx: index('incidents_status_started_idx').on(t.status, t.startedAt),
  }),
);

export const incidentRegions = pgTable(
  'incident_regions',
  {
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    stateId: uuid('state_id')
      .notNull()
      .references(() => states.id),
    municipalityId: uuid('municipality_id').references(() => municipalities.id),
    reportCount: integer('report_count').notNull().default(0),
    confidence: real('confidence').notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.incidentId, t.stateId] }),
  }),
);

export const officialUpdates = pgTable('official_updates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  incidentId: uuid('incident_id').references(() => incidents.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  sourceUrl: text('source_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by'),
});

// ---------------------------------------------------------------------------
// Usuarios, suscripciones, moderación, auditoría
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  status: varchar('status', { length: 16 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Segundo factor TOTP (Etapa 6), obligatorio para administradores. El secreto se
  // guarda cifrado (AES-256-GCM, src/lib/auth/crypto.ts), nunca en claro;
  // totp_enabled_at null = alta pendiente.
  totpSecretEnc: text('totp_secret_enc'),
  totpEnabledAt: timestamp('totp_enabled_at', { withTimezone: true }),
  // Último paso TOTP aceptado: el mismo código no vale dos veces (anti-repetición).
  totpLastStep: integer('totp_last_step'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

/**
 * Sesiones del panel de administración (Etapa 6). En la base solo vive el hash
 * SHA-256 del token; el token en claro solo existe en la cookie httpOnly. Así una
 * sesión se revoca borrando su fila, y una copia de la base no permite suplantar a
 * nadie. `stage`: pending_mfa (contraseña correcta, falta el código), enrolling (alta
 * del TOTP pendiente) o active.
 */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    stage: varchar('stage', { length: 16 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: varchar('user_agent', { length: 160 }),
  },
  (t) => ({
    userIdx: index('admin_sessions_user_idx').on(t.userId),
  }),
);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  stateId: uuid('state_id').references(() => states.id),
  channel: subscriptionChannelEnum('channel').notNull().default('email'),
  threshold: integer('threshold').notNull().default(55), // umbral mínimo de confianza (0-100)
  active: boolean('active').notNull().default(true),
});

export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  moderatorId: uuid('moderator_id')
    .notNull()
    .references(() => users.id),
  targetType: varchar('target_type', { length: 32 }).notNull(), // 'report' | 'comment'
  targetId: uuid('target_id').notNull(),
  action: moderationActionEnum('action').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 64 }).notNull(),
    entity: varchar('entity', { length: 64 }).notNull(),
    entityId: uuid('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index('audit_entity_idx').on(t.entity, t.entityId),
  }),
);

# Diccionario de datos

Generado desde `src/lib/db/schema.ts` con `npm run docs:data`. No contiene registros de usuarios ni acredita que una base desplegada coincida con este esquema.

Clasificación y decisiones operativas: [ESTANDARES-Y-CONTROLES.md](ESTANDARES-Y-CONTROLES.md). PK compuesta y FK se reflejan por columna. La existencia de una FK no implica que sus borrados en cascada sean adecuados para toda política de retención.

## aggregated_windows

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| service_id | uuid | no | no | no | services.id (DELETE cascade) |
| state_id | uuid | sí | no | no | states.id (DELETE no action) |
| window_start | timestamp with time zone | no | no | no | — |
| window_end | timestamp with time zone | no | no | no | — |
| total_reports | integer | no | no | sí | — |
| unique_reporters | integer | no | no | sí | — |
| weighted_reports | real | no | no | sí | — |
| anomaly_score | real | no | no | sí | — |
| technical_score | real | no | no | sí | — |
| confidence | real | no | no | sí | — |
| created_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: aw_service_window_idx.

## audit_logs

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| user_id | uuid | sí | no | no | users.id (DELETE no action) |
| action | varchar(64) | no | no | no | — |
| entity | varchar(64) | no | no | no | — |
| entity_id | uuid | sí | no | no | — |
| before | jsonb | sí | no | no | — |
| after | jsonb | sí | no | no | — |
| ip_hash | varchar(64) | sí | no | no | — |
| created_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: audit_entity_idx.

## baselines

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| service_id | uuid | no | no | no | services.id (DELETE cascade) |
| state_id | uuid | sí | no | no | states.id (DELETE no action) |
| weekday | smallint | no | no | no | — |
| hour | smallint | no | no | no | — |
| median_reports | real | no | no | sí | — |
| dispersion | real | no | no | sí | — |
| sample_size | integer | no | no | sí | — |
| updated_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: baselines_unique_bucket.

## categories

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| slug | varchar(64) | no | no | no | — |
| name | text | no | no | no | — |
| description | text | sí | no | no | — |
| icon | varchar(32) | no | no | sí | — |
| sort_order | integer | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## incident_regions

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| incident_id | uuid | no | no | no | incidents.id (DELETE cascade) |
| state_id | uuid | no | no | no | states.id (DELETE no action) |
| municipality_id | uuid | sí | no | no | municipalities.id (DELETE no action) |
| report_count | integer | no | no | sí | — |
| confidence | real | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## incidents

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| service_id | uuid | no | no | no | services.id (DELETE cascade) |
| status | incident_status | no | no | sí | — |
| confidence | real | no | no | sí | — |
| severity | varchar(16) | no | no | sí | — |
| started_at | timestamp with time zone | no | no | sí | — |
| peak_at | timestamp with time zone | sí | no | no | — |
| ended_at | timestamp with time zone | sí | no | no | — |
| summary | text | sí | no | no | — |
| officially_confirmed | boolean | no | no | sí | — |
| source_url | text | sí | no | no | — |
| created_by | uuid | sí | no | no | — |
| created_at | timestamp with time zone | no | no | sí | — |
| updated_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: incidents_service_status_idx, incidents_status_started_idx.

## issue_types

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| category_id | uuid | sí | no | no | categories.id (DELETE no action) |
| name | text | no | no | no | — |
| slug | varchar(64) | no | no | no | — |
| active | boolean | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## moderation_actions

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| moderator_id | uuid | no | no | no | users.id (DELETE no action) |
| target_type | varchar(32) | no | no | no | — |
| target_id | uuid | no | no | no | — |
| action | moderation_action | no | no | no | — |
| reason | text | sí | no | no | — |
| created_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## municipalities

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| state_id | uuid | no | no | no | states.id (DELETE cascade) |
| name | text | no | no | no | — |
| geometry | jsonb | sí | no | no | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## official_updates

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| service_id | uuid | no | no | no | services.id (DELETE cascade) |
| incident_id | uuid | sí | no | no | incidents.id (DELETE set null) |
| title | text | no | no | no | — |
| content | text | no | no | no | — |
| source_url | text | sí | no | no | — |
| published_at | timestamp with time zone | no | no | sí | — |
| verified_at | timestamp with time zone | sí | no | no | — |
| verified_by | uuid | sí | no | no | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## reports

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| service_id | uuid | no | no | no | services.id (DELETE cascade) |
| issue_type_id | uuid | no | no | no | issue_types.id (DELETE no action) |
| state_id | uuid | no | no | no | states.id (DELETE no action) |
| municipality_id | uuid | sí | no | no | municipalities.id (DELETE no action) |
| city_text | varchar(120) | sí | no | no | — |
| network_carrier | varchar(64) | sí | no | no | — |
| comment | varchar(280) | sí | no | no | — |
| source | report_source | no | no | sí | — |
| anonymous_hash | varchar(64) | no | no | no | — |
| ip_prefix_hash | varchar(64) | no | no | no | — |
| confidence | real | no | no | sí | — |
| suspicious | boolean | no | no | sí | — |
| created_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: reports_service_created_idx, reports_anon_hash_idx, reports_ip_prefix_idx.

## service_endpoints

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| service_id | uuid | no | no | no | services.id (DELETE cascade) |
| type | check_type | no | no | no | — |
| target | text | no | no | no | — |
| region | varchar(32) | no | no | sí | — |
| active | boolean | no | no | sí | — |
| frequency_seconds | integer | no | no | sí | — |
| timeout_ms | integer | no | no | sí | — |
| created_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## services

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| slug | varchar(96) | no | no | no | — |
| name | text | no | no | no | — |
| description | text | sí | no | no | — |
| category_id | uuid | no | no | no | categories.id (DELETE no action) |
| logo_url | text | sí | no | no | — |
| official_url | text | sí | no | no | — |
| active | boolean | no | no | sí | — |
| is_demo | boolean | no | no | sí | — |
| created_at | timestamp with time zone | no | no | sí | — |
| updated_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: services_category_idx.

## states

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| name | text | no | no | no | — |
| code | varchar(8) | no | no | no | — |
| grid_row | integer | no | no | no | — |
| grid_col | integer | no | no | no | — |
| geometry | jsonb | sí | no | no | — |
| active | boolean | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## subscriptions

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| user_id | uuid | no | no | no | users.id (DELETE cascade) |
| service_id | uuid | no | no | no | services.id (DELETE cascade) |
| state_id | uuid | sí | no | no | states.id (DELETE no action) |
| channel | subscription_channel | no | no | sí | — |
| threshold | integer | no | no | sí | — |
| active | boolean | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## technical_checks

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| service_endpoint_id | uuid | no | no | no | service_endpoints.id (DELETE cascade) |
| check_type | check_type | no | no | no | — |
| success | boolean | no | no | no | — |
| latency_ms | integer | sí | no | no | — |
| packet_loss | real | sí | no | no | — |
| status_code | integer | sí | no | no | — |
| error_code | varchar(64) | sí | no | no | — |
| metadata | jsonb | sí | no | no | — |
| checked_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: tc_endpoint_checked_idx.

## users

| Columna SQL | Tipo | Nullable | PK | Default | Referencia |
| --- | --- | --- | --- | --- | --- |
| id | uuid | no | sí | sí | — |
| email | varchar(255) | no | no | no | — |
| password_hash | text | no | no | no | — |
| role | user_role | no | no | sí | — |
| status | varchar(16) | no | no | sí | — |
| created_at | timestamp with time zone | no | no | sí | — |

Índices explícitos: ninguno (puede haber índices implícitos de PK/UNIQUE).

## Enumeraciones

- `check_type`: `http`, `https`, `dns`, `ping`, `traceroute`, `tls`, `api`.
- `incident_status`: `possible`, `detected`, `high_confidence`, `confirmed`, `recovering`, `resolved`.
- `moderation_action`: `mark_spam`, `mark_fraudulent`, `hide`, `restore`, `escalate`.
- `report_source`: `web`, `api`, `admin`.
- `subscription_channel`: `email`, `web_push`, `telegram`, `whatsapp`.
- `user_role`: `admin`, `moderator`, `user`.

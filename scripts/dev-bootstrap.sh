#!/usr/bin/env bash
# Deja el entorno de desarrollo listo desde cero, sin pasos manuales:
# dependencias, PostgreSQL local, .env con secretos nuevos, migraciones y datos
# semilla. Es idempotente: se puede repetir sin romper nada y nunca toca un .env
# que ya exista.
#
# Pensado para un contenedor Linux (Debian/Ubuntu) con PostgreSQL 16 instalado,
# como las sesiones de Claude Code en la nube. Con un Postgres propio ya en
# marcha también sirve; si no puede arrancarlo o crear el rol, dice qué falta.
#
# Uso:  bash scripts/dev-bootstrap.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

say() { printf '→ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; exit 1; }

command -v node >/dev/null || fail 'Falta Node.js 22+.'
command -v psql >/dev/null || fail 'Falta el cliente de PostgreSQL (psql).'
command -v pg_isready >/dev/null || fail 'Falta pg_isready (paquete postgresql-client).'

# 1. Dependencias -----------------------------------------------------------
if [ -d node_modules ]; then
  say 'Dependencias: node_modules ya existe'
else
  say 'Dependencias: npm ci'
  npm ci
fi

# 2. .env (nunca se commitea; los secretos se generan aquí) ----------------
if [ -f .env ]; then
  say '.env: ya existe, no se toca'
else
  command -v openssl >/dev/null || fail 'Falta openssl para generar los secretos de .env.'
  say '.env: creándolo desde .env.example con secretos nuevos'
  cp .env.example .env
  jwt=$(openssl rand -hex 32)
  salt=$(openssl rand -hex 32)
  sed -i.bak -e "s|^JWT_SECRET=.*|JWT_SECRET=\"$jwt\"|" \
    -e "s|^ANONYMIZATION_SALT=.*|ANONYMIZATION_SALT=\"$salt\"|" .env
  rm -f .env.bak
fi

# 3. Datos de conexión (de DATABASE_URL en .env) ----------------------------
db_url=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')
[ -n "$db_url" ] || fail 'DATABASE_URL no está definida en .env.'
part() {
  node -e 'const u = new URL(process.argv[1]);
    const f = { user: decodeURIComponent(u.username), pass: decodeURIComponent(u.password),
      host: u.hostname, port: u.port || "5432", name: u.pathname.slice(1) };
    process.stdout.write(f[process.argv[2]]);' "$db_url" "$1"
}
db_user=$(part user)
db_pass=$(part pass)
db_host=$(part host)
db_port=$(part port)
db_name=$(part name)
is_local=0
case "$db_host" in localhost | 127.0.0.1 | ::1) is_local=1 ;; esac

# 4. PostgreSQL en marcha ---------------------------------------------------
if pg_isready -q -h "$db_host" -p "$db_port"; then
  say 'PostgreSQL: ya está en marcha'
else
  [ "$is_local" = 1 ] || fail "No se alcanza PostgreSQL en $db_host:$db_port."
  say 'PostgreSQL: arrancándolo'
  if [ "$(id -u)" = 0 ]; then
    service postgresql start >/dev/null 2>&1 || true
  elif command -v sudo >/dev/null; then
    sudo service postgresql start >/dev/null 2>&1 || true
  fi
  for _ in $(seq 1 30); do
    pg_isready -q -h "$db_host" -p "$db_port" && break
    sleep 1
  done
  pg_isready -q -h "$db_host" -p "$db_port" || fail 'No pude arrancar PostgreSQL. Arráncalo a mano y repite.'
fi

# 5. Rol y base de datos ----------------------------------------------------
as_postgres() {
  if [ "$(id -u)" = 0 ] && command -v runuser >/dev/null; then
    runuser -u postgres -- "$@"
  elif command -v sudo >/dev/null; then
    sudo -u postgres "$@"
  else
    return 127
  fi
}
can_connect() { psql -w "$db_url" -Atqc 'select 1' >/dev/null 2>&1; }

if can_connect; then
  say "Base de datos: ya se puede entrar con DATABASE_URL ($db_name)"
else
  [ "$is_local" = 1 ] || fail "No puedo entrar a $db_name con DATABASE_URL y la base no es local."
  say "Base de datos: creando el rol '$db_user' y la base '$db_name'"
  (
    cd /
    as_postgres psql -v ON_ERROR_STOP=1 -q -v u="$db_user" -v p="$db_pass" -v d="$db_name" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L CREATEDB', :'u', :'p')
 WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'u') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'d', :'u')
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'d') \gexec
SQL
  ) || fail "No pude crear el rol/base como superusuario. Créalos a mano: rol '$db_user', base '$db_name'."
  can_connect || fail 'Sigo sin poder entrar con DATABASE_URL (¿el rol ya existía con otra contraseña?).'
fi

# 6. Migraciones y datos semilla --------------------------------------------
# `drizzle-kit migrate` puede colgarse sin terminal interactiva: se corta a los
# 3 minutos. Alternativa: psql -f drizzle/0000_*.sql y drizzle/0001_*.sql.
say 'Migraciones'
if command -v timeout >/dev/null; then
  timeout 180 npm run db:migrate:deploy </dev/null || fail 'Falló drizzle-kit migrate (o se colgó).'
else
  npm run db:migrate:deploy </dev/null || fail 'Falló drizzle-kit migrate.'
fi
say 'Datos semilla'
npm run db:seed

printf '\n✓ Entorno listo.\n'
printf '  Comprobar:  npm run typecheck && npm test\n'
printf '  Servidor:   npm run dev   (http://localhost:3000)\n'
printf '  Ojo: las pruebas de API insertan filas reales en esta base; límpialas después (ver CLAUDE.md).\n'

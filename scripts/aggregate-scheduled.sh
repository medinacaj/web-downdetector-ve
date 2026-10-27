#!/usr/bin/env bash
# Un solo host/usuario ejecutor. El bloqueo no coordina máquinas diferentes.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
command -v flock >/dev/null || { echo 'Falta flock (util-linux).' >&2; exit 1; }
mkdir -p .runtime
exec 9>.runtime/aggregate.lock
# Otra ejecución activa: omitir este intento sin arrancar un segundo motor.
if flock -n -E 75 9; then
  :
else
  status=$?
  [ "$status" -eq 75 ] && exit 0
  exit "$status"
fi
npm run aggregate:run -- --completed --window=15

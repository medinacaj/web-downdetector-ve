/** TTL local de 5s, respuesta en 2s y una sola consulta pendiente por proceso. */
export function createReadinessCheck(probe: () => Promise<unknown>) {
  let cached: { ready: boolean; until: number } | undefined;
  let active: Promise<boolean> | undefined;
  let overdue = false;
  return async function check(): Promise<boolean> {
    if (cached && performance.now() < cached.until) return cached.ready;
    if (overdue) return false;
    if (active) return active;
    let timer: ReturnType<typeof setTimeout>;
    const work = Promise.resolve().then(probe).then(() => true, () => false)
      .finally(() => { overdue = false; });
    const deadline = new Promise<boolean>(resolve => {
      timer = setTimeout(() => { overdue = true; resolve(false); }, 2000);
    });
    active = Promise.race([work, deadline]).then(ready => {
      cached = { ready, until: performance.now() + 5000 };
      return ready;
    }).finally(() => { clearTimeout(timer!); active = undefined; });
    return active;
  };
}

import type { ApiErrorCode } from './respond';

type BodyErrorCode = Extract<ApiErrorCode, 'validation_error' | 'unsupported_media_type' | 'payload_too_large' | 'request_timeout'>;
export class RequestBodyError extends Error {
  constructor(public readonly code: BodyErrorCode, message: string) { super(message); }
}

/** Cuenta bytes del stream; no confía en Content-Length ni registra el cuerpo. */
export async function readJsonBody(request: Request): Promise<unknown> {
  const maxBytes = 16_384;
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestBodyError('unsupported_media_type', 'Envía el reporte como application/json.');
  }
  const length = request.headers.get('content-length');
  if (length && /^\d+$/.test(length) && Number(length) > maxBytes) {
    void request.body?.cancel().catch(() => {});
    throw new RequestBodyError('payload_too_large', 'El reporte supera el tamaño permitido.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError('validation_error', 'El cuerpo JSON es obligatorio.');
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestBodyError('request_timeout', 'Se agotó el tiempo para recibir el reporte.')), 5000);
  });
  try {
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new RequestBodyError('payload_too_large', 'El reporte supera el tamaño permitido.');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError('validation_error', 'El cuerpo de la solicitud no es JSON válido.');
  } finally {
    clearTimeout(timer!);
    void reader.cancel().catch(() => {});
  }
}

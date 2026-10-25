'use client';

import { useActionState } from 'react';
import { confirmEnrollmentAction, loginAction, verifyCodeAction, type FormState } from '@/app/admin/actions';

const INITIAL: FormState = { error: null };
const input =
  'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-pulse-500';
const button =
  'w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50';

function ErrorText({ state }: { state: FormState }) {
  return state.error ? (
    <p role="alert" className="text-sm text-status-incident">
      {state.error}
    </p>
  ) : null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Correo
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" defaultValue={state.email} key={state.email} className={input} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
      </div>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? 'Comprobando…' : 'Continuar'}
      </button>
    </form>
  );
}

function CodeForm({ action: serverAction, submitLabel }: { action: typeof verifyCodeAction; submitLabel: string }) {
  const [state, action, pending] = useActionState(serverAction, INITIAL);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="code" className="text-sm font-medium">
          Código de 6 dígitos
        </label>
        <input
          id="code"
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          className={`${input} font-mono tracking-[0.3em]`}
        />
      </div>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? 'Comprobando…' : submitLabel}
      </button>
    </form>
  );
}

export function VerifyCodeForm() {
  return <CodeForm action={verifyCodeAction} submitLabel="Entrar" />;
}

export function EnrollForm() {
  return <CodeForm action={confirmEnrollmentAction} submitLabel="Activar y entrar" />;
}

"use client";

import { useActionState } from "react";
import { signInWithEmail, type FormState } from "../actions";

export function EmailForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInWithEmail, {});
  if (state.ok) return <p className="border border-green bg-green-soft p-4 text-green">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-ink-2">Recevez un lien de connexion par e-mail. Pas de mot de passe à retenir.</p>
      {next && <input type="hidden" name="next" value={next} />}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Adresse e-mail
        <input type="email" name="email" required autoComplete="email" className="field" />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}

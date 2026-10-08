"use client";

import { useActionState } from "react";
import { submitMessage, type FormState } from "@/app/actions";

export function Guestbook({ memorialId }: { memorialId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitMessage, {});

  if (state.ok) {
    return <p className="border border-green bg-green-soft p-4 text-sm text-green">{state.message}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3 border border-rule bg-surface p-4">
      <h3 className="font-semibold">Laisser un message</h3>
      <input type="hidden" name="memorialId" value={memorialId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Votre prénom
          <input name="authorName" required maxLength={80} className="field" autoComplete="given-name" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          D’où écrivez-vous ? <span className="font-normal text-muted">(facultatif)</span>
          <input name="authorPlace" maxLength={80} className="field" placeholder="Petit-Canal, Créteil…" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Votre message
        <textarea name="body" required maxLength={1500} rows={3} className="field resize-y" placeholder="Un souvenir, une pensée…" />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn self-start">
        {pending ? "Envoi…" : "Envoyer à la famille"}
      </button>
      <p className="text-xs text-muted">La famille lit chaque message avant de le publier.</p>
    </form>
  );
}

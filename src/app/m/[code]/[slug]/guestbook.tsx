"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitMessage, type FormState } from "@/app/actions";

export function Guestbook({ memorialId }: { memorialId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitMessage, {});
  // Champs contrôlés : React vide le formulaire après chaque envoi, même refusé.
  const [fields, setFields] = useState({ authorName: "", authorPlace: "", body: "", consent: false });
  // Heure de la première saisie : un robot qui envoie sans saisir, ou en moins de 3 secondes, est ignoré.
  const [startedAt, setStartedAt] = useState("");
  const set = (name: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [name]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  if (state.ok) {
    return <p className="border border-green bg-green-soft p-4 text-sm text-green">{state.message}</p>;
  }

  return (
    <form
      action={action}
      onFocus={() => startedAt || setStartedAt(String(Date.now()))}
      className="relative flex flex-col gap-3 border border-rule bg-surface p-4"
    >
      <h3 className="font-semibold">Laisser un message</h3>
      <input type="hidden" name="memorialId" value={memorialId} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Votre prénom
          <input name="authorName" required maxLength={80} className="field" autoComplete="given-name" value={fields.authorName} onChange={set("authorName")} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          D’où écrivez-vous ? <span className="font-normal text-muted">(facultatif)</span>
          <input name="authorPlace" maxLength={80} className="field" placeholder="Petit-Canal, Créteil…" value={fields.authorPlace} onChange={set("authorPlace")} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Votre message
        <textarea
          name="body"
          required
          maxLength={1500}
          rows={3}
          className="field resize-y"
          placeholder="Un souvenir, une pensée…"
          value={fields.body}
          onChange={set("body")}
        />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-1" checked={fields.consent} onChange={set("consent")} />
        <span>
          J’accepte que la famille lise mon message et choisisse de le publier, avec mon prénom.{" "}
          <Link href="/confidentialite" className="underline">
            Vos données
          </Link>
        </span>
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

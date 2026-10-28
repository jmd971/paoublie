"use client";

import { useState, useTransition } from "react";
import { createInvitation } from "@/app/actions";

type Props = {
  tombId: string;
  role: "guardian" | "member";
  label: string;
  /** Texte du message envoyé avec le lien. */
  message: string;
};

/** Crée un lien d'invitation et propose de l'envoyer par WhatsApp ou SMS. */
export function InviteLink({ tombId, role, label, message }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  if (!url) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          className="btn self-start"
          onClick={() =>
            start(async () => {
              const r = await createInvitation(tombId, role);
              if ("error" in r) setError(r.error);
              else setUrl(r.url);
            })
          }
        >
          {pending ? "Création du lien…" : label}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red">
            {error}
          </p>
        )}
      </div>
    );
  }

  const text = `${message} ${url}`;
  return (
    <div className="flex flex-col gap-3 border border-green bg-green-soft p-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-green">
        Lien à envoyer
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field font-mono text-xs text-ink" />
      </label>
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="btn min-h-10 text-sm">
          Envoyer par WhatsApp
        </a>
        <a href={`sms:?&body=${encodeURIComponent(text)}`} className="btn btn-ghost min-h-10 text-sm">
          Envoyer par SMS
        </a>
        <button
          type="button"
          className="btn btn-ghost min-h-10 text-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
      </div>
      <p className="text-xs text-ink-2">
        {role === "guardian"
          ? "Ce lien ne sert qu’une fois : la personne qui l’ouvre devient gardienne de la page."
          : "Ce lien reste valable 60 jours et peut servir à plusieurs proches."}
      </p>
    </div>
  );
}

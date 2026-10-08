"use client";

import { useActionState } from "react";
import { createMemorial, type FormState } from "@/app/actions";
import { FORMULAS, euros } from "@/lib/pricing";

export function MemorialForm({ code, forFamily }: { code?: string; forFamily: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createMemorial, {});

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-serif text-xl font-bold">{forFamily ? "Qui souhaitez-vous honorer ?" : "Le défunt"}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" required autoComplete="off" />
          <Field label="Nom" name="lastName" required autoComplete="off" />
        </div>
        <Field label="Surnom" name="nickname" hint="Comment l’appelait-on ? Par exemple : Man Nini" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date de naissance" name="birthDate" type="date" />
          <Field label="Date de décès" name="deathDate" type="date" />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-serif text-xl font-bold">Le lieu de repos</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Commune" name="commune" required defaultValue="Petit-Canal" />
          <Field label="Cimetière" name="cemetery" required placeholder="Cimetière de Petit-Canal" />
        </div>
        <Field label="Emplacement" name="locationLabel" hint="Allée et numéro, pour aider les proches à trouver la tombe" />
        <Field
          label="Code de la plaque"
          name="code"
          defaultValue={code}
          hint="Inscrit sous le QR code. Laissez vide si la plaque n’a pas encore été remise : un code sera créé."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-serif text-xl font-bold">Son histoire</legend>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Quelques mots sur sa vie <span className="font-normal text-muted">(vous pourrez compléter plus tard)</span>
          <textarea name="story" rows={5} maxLength={5000} className="field resize-y" />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-serif text-xl font-bold">La formule</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(FORMULAS).map(([key, f]) => (
            <label
              key={key}
              className="flex cursor-pointer flex-col gap-1 border border-rule bg-surface p-4 has-checked:border-2 has-checked:border-amber has-checked:bg-amber-soft"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 font-serif text-lg font-bold">
                  <input type="radio" name="formula" value={key} defaultChecked={key === "memoire"} className="accent-amber" />
                  {f.name}
                </span>
                <span className="font-mono">{euros(f.ttcCents)}</span>
              </span>
              <span className="text-sm text-ink-2">{f.pitch}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-serif text-xl font-bold">Qui peut voir la page ?</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="visibility" value="public" defaultChecked className="accent-green" />
          Tout le monde, avec le QR code ou le lien
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="visibility" value="family" className="accent-green" />
          Seulement la famille
        </label>
      </fieldset>

      {state.error && (
        <p role="alert" className="border border-red bg-red-soft p-3 text-sm text-red">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-amber self-start">
        {pending ? "Création…" : "Créer le mémorial"}
      </button>
      <p className="text-sm text-muted">Le paiement se fera à la remise de la plaque. Le mémorial est visible dès maintenant.</p>
    </form>
  );
}

function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input className="field font-normal" maxLength={120} {...input} />
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

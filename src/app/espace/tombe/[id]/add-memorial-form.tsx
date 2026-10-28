"use client";

import { useActionState } from "react";
import { addMemorialToTomb, type FormState } from "@/app/actions";
import { Field, GenderField, submitWithoutReset } from "@/components/fields";

export function AddMemorialForm({ tombId, familyName }: { tombId: string; familyName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMemorialToTomb, {});
  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4 border border-rule bg-surface p-4">
      <input type="hidden" name="tombId" value={tombId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" required autoComplete="off" />
        <Field label="Nom" name="lastName" required defaultValue={familyName} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Surnom" name="nickname" />
        <Field label="Lien de parenté" name="relation" placeholder="Son époux, sa fille…" />
      </div>
      <GenderField />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de naissance" name="birthDate" type="date" />
        <Field label="Date de décès" name="deathDate" type="date" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn self-start">
        {pending ? "Ajout…" : "Ajouter sur cette tombe"}
      </button>
    </form>
  );
}

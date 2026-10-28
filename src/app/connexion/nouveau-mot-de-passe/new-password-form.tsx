"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "@/app/actions";
import { Feedback, PasswordField } from "@/components/auth-forms";
import { submitWithoutReset } from "@/components/fields";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
      <PasswordField autoComplete="new-password" label="Nouveau mot de passe" hint="8 caractères au moins." />
      <PasswordField name="confirm" autoComplete="new-password" label="Le même, une seconde fois" />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}

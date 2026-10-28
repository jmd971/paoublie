"use client";

import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "@/app/actions";
import { EmailField, Feedback } from "@/components/auth-forms";
import { submitWithoutReset } from "@/components/fields";

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) return <Feedback state={state} />;
  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
      <EmailField />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type FormState } from "@/app/actions";
import { submitWithoutReset } from "@/components/fields";

type Tab = "connexion" | "inscription";

/** Connexion et création de compte, en deux onglets. */
export function AuthForms({ next, defaultTab = "connexion" }: { next?: string; defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const tabs: [Tab, string][] = [
    ["connexion", "Se connecter"],
    ["inscription", "Créer un compte"],
  ];
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Connexion ou inscription" className="grid grid-cols-2 border border-rule bg-surface p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`onglet-${id}`}
            aria-selected={tab === id}
            aria-controls={`panneau-${id}`}
            onClick={() => setTab(id)}
            className={`min-h-11 text-sm font-medium ${tab === id ? "bg-green text-on-accent" : "text-ink-2"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panneau-${tab}`} aria-labelledby={`onglet-${tab}`}>
        {tab === "connexion" ? <SignInForm next={next} /> : <SignUpForm next={next} />}
      </div>
    </div>
  );
}

function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <EmailField />
      <PasswordField autoComplete="current-password" />
      <Link href="/connexion/mot-de-passe-oublie" className="-mt-2 self-start text-sm text-green underline-offset-2 hover:underline">
        Mot de passe oublié ?
      </Link>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn">
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

function SignUpForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  if (state.ok) return <p className="border border-green bg-green-soft p-4 text-green">{state.message}</p>;
  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Prénom
        <input name="firstName" required maxLength={60} autoComplete="given-name" className="field font-normal" />
      </label>
      <EmailField />
      <PasswordField autoComplete="new-password" hint="8 caractères au moins." />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn btn-amber">
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <p className="text-xs text-muted">
        En créant un compte, vous acceptez les{" "}
        <Link href="/cgu" className="underline">
          conditions d’utilisation
        </Link>
        .
      </p>
    </form>
  );
}

export function EmailField() {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      Adresse e-mail
      <input type="email" name="email" required autoComplete="email" inputMode="email" className="field font-normal" />
    </label>
  );
}

export function PasswordField({
  name = "password",
  label = "Mot de passe",
  autoComplete,
  hint,
}: {
  name?: string;
  label?: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <span className="flex gap-2">
        <input
          type={visible ? "text" : "password"}
          name={name}
          required
          minLength={autoComplete === "new-password" ? 8 : undefined}
          maxLength={72}
          autoComplete={autoComplete}
          className="field flex-1 font-normal"
        />
        <button type="button" onClick={() => setVisible((v) => !v)} className="btn btn-ghost min-h-11 px-3 text-sm font-normal">
          {visible ? "Masquer" : "Afficher"}
        </button>
      </span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Feedback({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-red">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="border border-green bg-green-soft p-3 text-sm text-green">
        {state.message}
      </p>
    );
  }
  return null;
}

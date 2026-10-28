import { startTransition } from "react";
import type { Gender } from "@/lib/types";

/**
 * Envoie le formulaire sans que React le vide ensuite : si l'enregistrement est refusé,
 * la saisie reste en place pour être corrigée.
 */
export function submitWithoutReset(action: (data: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

export function Field({
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

/** Sert à accorder « dit / dite » et à choisir le portrait par défaut. */
export function GenderField({ defaultValue }: { defaultValue?: Gender }) {
  const options: [string, string][] = [
    ["f", "Une femme"],
    ["m", "Un homme"],
    ["", "Ne pas préciser"],
  ];
  return (
    <fieldset className="flex flex-col gap-1 text-sm font-medium">
      <legend className="mb-1">C’était</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2 font-normal">
        {options.map(([value, label]) => (
          <label key={label} className="flex items-center gap-2">
            <input type="radio" name="gender" value={value} defaultChecked={(defaultValue ?? "") === value} className="accent-green" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

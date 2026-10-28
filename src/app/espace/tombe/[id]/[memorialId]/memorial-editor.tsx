"use client";

import { useActionState, useState } from "react";
import { updateMemorial, type FormState } from "@/app/actions";
import { Field, GenderField, submitWithoutReset } from "@/components/fields";
import type { Chapter, Love, Memorial } from "@/lib/types";

export function MemorialEditor({ memorial: m }: { memorial: Memorial }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateMemorial, {});
  const [chapters, setChapters] = useState<Chapter[]>(m.chapters.length ? m.chapters : [{ years: "", title: "", text: "" }]);
  const [loves, setLoves] = useState<Love[]>(m.loves);

  const editChapter = (i: number, patch: Partial<Chapter>) => setChapters((list) => list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const editLove = (i: number, patch: Partial<Love>) => setLoves((list) => list.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-8">
      <input type="hidden" name="memorialId" value={m.id} />
      <input type="hidden" name="tombId" value={m.tombId} />
      <input type="hidden" name="chapters" value={JSON.stringify(chapters)} />
      <input type="hidden" name="loves" value={JSON.stringify(loves)} />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-serif text-xl font-bold">Identité</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" required defaultValue={m.firstName} />
          <Field label="Nom" name="lastName" required defaultValue={m.lastName} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Surnom" name="nickname" defaultValue={m.nickname} />
          <Field label="Lien de parenté" name="relation" defaultValue={m.relation} placeholder="Notre grand-mère" />
        </div>
        <GenderField defaultValue={m.gender} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Naissance" name="birthDate" type="date" defaultValue={m.birthDate?.slice(0, 10)} />
          <Field label="Décès" name="deathDate" type="date" defaultValue={m.deathDate?.slice(0, 10)} />
          <Field label="Lieu de naissance" name="birthPlace" defaultValue={m.birthPlace} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-serif text-xl font-bold">Sa phrase</legend>
        <Field label="Une phrase qu’il ou elle disait souvent" name="quote" maxLength={200} defaultValue={m.quote} placeholder="Sa ki ta’w, lariviè pa ka chayé’y" />
        <Field label="Traduction (facultatif)" name="quoteTranslation" maxLength={300} defaultValue={m.quoteTranslation} />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-serif text-xl font-bold">Sa vie, chapitre par chapitre</legend>
        {chapters.map((c, i) => (
          <div key={i} className="flex flex-col gap-3 border border-rule bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Années
                <input value={c.years} onChange={(e) => editChapter(i, { years: e.target.value })} maxLength={30} className="field font-normal" placeholder="1952 – 1970" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Titre
                <input value={c.title} onChange={(e) => editChapter(i, { title: e.target.value })} maxLength={100} className="field font-normal" placeholder="L’enfance à Port-Louis" />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Récit
              <textarea value={c.text} onChange={(e) => editChapter(i, { text: e.target.value })} maxLength={5000} rows={4} className="field resize-y font-normal" />
            </label>
            <button type="button" onClick={() => setChapters((l) => l.filter((_, j) => j !== i))} className="self-start text-sm text-red underline-offset-2 hover:underline">
              Retirer ce chapitre
            </button>
          </div>
        ))}
        {chapters.length < 30 && (
          <button type="button" onClick={() => setChapters((l) => [...l, { years: "", title: "", text: "" }])} className="btn btn-ghost self-start text-sm">
            Ajouter un chapitre
          </button>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-serif text-xl font-bold">Ce qu’il ou elle aimait</legend>
        {loves.map((l, i) => (
          <div key={i} className="flex flex-col gap-3 border border-rule bg-surface p-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Passion
              <input value={l.title} onChange={(e) => editLove(i, { title: e.target.value })} maxLength={100} className="field font-normal" placeholder="Le jardin créole" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              En quelques mots
              <textarea value={l.text} onChange={(e) => editLove(i, { text: e.target.value })} maxLength={1000} rows={2} className="field resize-y font-normal" />
            </label>
            <button type="button" onClick={() => setLoves((list) => list.filter((_, j) => j !== i))} className="self-start text-sm text-red underline-offset-2 hover:underline">
              Retirer
            </button>
          </div>
        ))}
        {loves.length < 20 && (
          <button type="button" onClick={() => setLoves((l) => [...l, { title: "", text: "" }])} className="btn btn-ghost self-start text-sm">
            Ajouter une passion
          </button>
        )}
      </fieldset>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-rule bg-paper py-3">
        <button type="submit" disabled={pending} className="btn btn-amber">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-red">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p role="status" className="text-sm text-green">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

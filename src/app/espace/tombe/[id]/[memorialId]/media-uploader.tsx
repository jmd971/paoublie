"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { prepareUpload, saveMedia } from "@/app/actions";
import type { MediaKind } from "@/lib/types";
import { UPLOAD_RULES } from "@/lib/uploads";

type Props = { memorialId: string; purpose?: "media" | "portrait" };

const KINDS: [MediaKind, string, string][] = [
  ["photo", "Photo", "image/*"],
  ["video", "Vidéo", "video/*"],
  ["audio", "Voix ou musique", "audio/*,.opus,.m4a,.ogg"],
];

/** Envoie un fichier : directement au stockage Supabase, ou au serveur en démonstration. */
export function MediaUploader({ memorialId, purpose = "media" }: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<MediaKind>("photo");
  const [status, setStatus] = useState<{ busy?: boolean; error?: string; done?: string }>({});
  const portrait = purpose === "portrait";
  const accept = KINDS.find(([k]) => k === kind)![2];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) return setStatus({ error: "Choisissez un fichier." });
    setStatus({ busy: true });

    const prepared = await prepareUpload(memorialId, kind, { type: file.type, name: file.name, size: file.size });
    if ("error" in prepared) return setStatus({ error: prepared.error });

    const body = new FormData();
    body.set("memorialId", memorialId);
    body.set("kind", kind);
    body.set("purpose", purpose);
    body.set("caption", String(data.get("caption") ?? ""));
    const { target } = prepared;
    if (target.mode === "storage") {
      const storage = createClient(target.supabaseUrl, target.anonKey).storage.from(target.bucket);
      const { error } = await storage.uploadToSignedUrl(target.path, target.token, file, { contentType: prepared.type });
      if (error) return setStatus({ error: "L’envoi a échoué. Vérifiez votre connexion et réessayez." });
      body.set("path", target.path);
    } else {
      body.set("file", file);
    }

    const saved = await saveMedia(body);
    if (saved.error) return setStatus({ error: saved.error });
    form.reset();
    setStatus({ done: portrait ? "Portrait mis à jour." : "Ajouté à la page." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 border border-rule bg-surface p-4">
      {!portrait && (
        <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <legend className="mb-1 font-medium">Que voulez-vous ajouter ?</legend>
          {KINDS.map(([k, label]) => (
            <label key={k} className="flex items-center gap-2">
              <input type="radio" name="kindChoice" checked={kind === k} onChange={() => setKind(k)} className="accent-green" />
              {label}
            </label>
          ))}
        </fieldset>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        {portrait ? "Photo du visage" : "Fichier"}
        <input type="file" name="file" accept={portrait ? "image/*" : accept} required className="text-sm font-normal" />
        <span className="text-xs font-normal text-muted">
          {portrait
            ? `Une photo nette, de face si possible. ${Math.round(UPLOAD_RULES.photo.maxBytes / 1048576)} Mo au plus.`
            : `${Math.round(UPLOAD_RULES[kind].maxBytes / 1048576)} Mo au plus.${kind === "audio" ? " Les messages vocaux WhatsApp sont acceptés." : ""}`}
        </span>
      </label>
      {!portrait && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Légende
          <input name="caption" maxLength={200} className="field font-normal" placeholder="Au mariage de Ginette, 1974" />
        </label>
      )}
      {status.error && (
        <p role="alert" className="text-sm text-red">
          {status.error}
        </p>
      )}
      {status.done && (
        <p role="status" className="text-sm text-green">
          {status.done}
        </p>
      )}
      <button type="submit" disabled={status.busy} className="btn self-start">
        {status.busy ? "Envoi en cours…" : portrait ? "Changer le portrait" : "Ajouter"}
      </button>
    </form>
  );
}

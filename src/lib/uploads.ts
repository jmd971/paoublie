import type { MediaKind } from "./types";

/** Types de fichiers acceptés, avec leur extension et la taille maximale. Partagé entre navigateur et serveur. */
export const UPLOAD_RULES: Record<MediaKind, { label: string; maxBytes: number; types: Record<string, string> }> = {
  photo: {
    label: "photo",
    maxBytes: 10 * 1024 * 1024,
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" },
  },
  audio: {
    label: "enregistrement",
    maxBytes: 20 * 1024 * 1024,
    types: {
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/aac": "aac",
      "audio/ogg": "ogg",
      "audio/webm": "webm",
      "audio/wav": "wav",
    },
  },
  video: {
    label: "vidéo",
    maxBytes: 100 * 1024 * 1024,
    types: { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" },
  },
};

/** Les messages WhatsApp vocaux arrivent souvent sans type MIME reconnu : on se fie alors à l'extension. */
const BY_EXTENSION: Record<string, string> = { opus: "audio/ogg", ogg: "audio/ogg", m4a: "audio/mp4", mp3: "audio/mpeg", mov: "video/quicktime" };

export function resolveType(kind: MediaKind, mime: string, filename: string): string | null {
  const rules = UPLOAD_RULES[kind].types;
  if (rules[mime]) return mime;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const guessed = BY_EXTENSION[ext];
  return guessed && rules[guessed] ? guessed : null;
}

export function checkUpload(kind: MediaKind, mime: string, filename: string, size: number): { ok: true; type: string; ext: string } | { ok: false; error: string } {
  const rules = UPLOAD_RULES[kind];
  const type = resolveType(kind, mime, filename);
  if (!type) return { ok: false, error: `Ce format de ${rules.label} n’est pas accepté.` };
  if (size > rules.maxBytes) return { ok: false, error: `Le fichier dépasse ${Math.round(rules.maxBytes / 1024 / 1024)} Mo.` };
  return { ok: true, type, ext: rules.types[type] };
}

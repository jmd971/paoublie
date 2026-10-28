const longDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function formatDate(iso?: string): string {
  return iso ? longDate.format(new Date(iso)) : "";
}

export function year(iso?: string): string {
  return iso ? iso.slice(0, 4) : "";
}

export function lifeSpan(birth?: string, death?: string): string {
  return [year(birth), year(death)].filter(Boolean).join(" – ");
}

const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

export function timeAgo(iso: string, now = Date.now()): string {
  const days = Math.round((new Date(iso).getTime() - now) / 86_400_000);
  if (Math.abs(days) < 1) return "aujourd’hui";
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  if (Math.abs(days) < 30) return rtf.format(Math.round(days / 7), "week");
  return rtf.format(Math.round(days / 30), "month");
}

export function count(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/** « dite Man Léo », « dit Ti Jo », ou le surnom entre guillemets si le genre n'est pas précisé. */
export function nicknameLabel(nickname: string, gender?: "f" | "m"): string {
  return gender === "f" ? `dite ${nickname}` : gender === "m" ? `dit ${nickname}` : `« ${nickname} »`;
}

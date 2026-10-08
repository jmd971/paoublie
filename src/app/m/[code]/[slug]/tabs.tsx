"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

export function Tabs({ panels }: { panels: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(panels[0]?.id);
  const base = useId();

  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = panels[(index + (e.key === "ArrowRight" ? 1 : panels.length - 1)) % panels.length];
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Sections du mémorial" className="sticky top-0 z-10 flex overflow-x-auto border-b border-rule bg-surface">
        {panels.map((p, i) => (
          <button
            key={p.id}
            id={`${base}-tab-${p.id}`}
            role="tab"
            type="button"
            aria-selected={active === p.id}
            aria-controls={`${base}-panel-${p.id}`}
            tabIndex={active === p.id ? 0 : -1}
            onClick={() => setActive(p.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`min-h-12 shrink-0 cursor-pointer border-b-[3px] px-4 text-sm whitespace-nowrap ${
              active === p.id ? "border-amber font-semibold text-ink" : "border-transparent text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {panels.map((p) => (
        <section
          key={p.id}
          id={`${base}-panel-${p.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${p.id}`}
          hidden={active !== p.id}
          className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6"
        >
          {p.content}
        </section>
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { dropFlower, lightCandle } from "@/app/actions";
import { count } from "@/lib/format";

type Props = { memorialId: string; path: string; candles: number; flowers: number; visits: number };

export function Gestures({ memorialId, path, candles, flowers, visits }: Props) {
  const [c, setC] = useState(candles);
  const [f, setF] = useState(flowers);
  const [lit, setLit] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [, start] = useTransition();

  return (
    <div className="border-b border-rule bg-surface">
      <dl className="mx-auto grid max-w-2xl grid-cols-3 text-center">
        {[
          [count(visits), "visites"],
          [count(c), "bougies"],
          [count(f), "fleurs"],
        ].map(([n, label]) => (
          <div key={label} className="py-3">
            <dt className="sr-only">{label}</dt>
            <dd className="font-mono text-lg tabular-nums">{n}</dd>
            <dd aria-hidden="true" className="text-xs text-muted">
              {label}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2 px-4 pb-4">
        <button
          type="button"
          disabled={lit}
          onClick={() => {
            setLit(true);
            setC((n) => n + 1);
            start(async () => setC(await lightCandle(memorialId, path)));
          }}
          className={`btn text-sm ${lit ? "border border-amber !bg-amber-soft !text-amber-ink" : "btn-amber"}`}
        >
          {lit ? "Votre bougie brille" : "Allumer une bougie"}
        </button>
        <button
          type="button"
          disabled={placed}
          onClick={() => {
            setPlaced(true);
            setF((n) => n + 1);
            start(async () => setF(await dropFlower(memorialId, path)));
          }}
          className={`btn btn-ghost text-sm ${placed ? "!border-green !bg-green-soft !text-green" : ""}`}
        >
          {placed ? "Fleur déposée" : "Déposer une fleur"}
        </button>
      </div>
    </div>
  );
}

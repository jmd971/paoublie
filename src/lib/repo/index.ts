import "server-only";
import { supabaseConfigured } from "../supabase/server";
import { demoRepo } from "./demo";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./types";

/** Sans variables Supabase, l'application tourne en mode démonstration. */
export const isDemo = !supabaseConfigured();

export const repo: Repo = isDemo ? demoRepo : supabaseRepo;

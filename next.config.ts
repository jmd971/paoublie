import type { NextConfig } from "next";

// Toutes les pages lisent la session ou des données vivantes (bougies, messages) :
// on reste en rendu dynamique classique plutôt qu'avec Cache Components.
const nextConfig: NextConfig = {
  experimental: {
    // En démonstration, les fichiers passent par l'action serveur (4 Mo au plus).
    // Avec Supabase, ils vont directement au stockage et ne passent pas par ici.
    serverActions: { bodySizeLimit: "5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

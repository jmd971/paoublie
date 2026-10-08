import type { NextConfig } from "next";

// Toutes les pages lisent la session ou des données vivantes (bougies, messages) :
// on reste en rendu dynamique classique plutôt qu'avec Cache Components.
const nextConfig: NextConfig = {
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

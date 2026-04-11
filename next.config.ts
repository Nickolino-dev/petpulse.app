import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! ATTENZIONE !!
    // Questo permette di completare il deploy anche se ci sono errori di TypeScript.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

"use client";

import "./globals.css";
import dynamic from "next/dynamic"; // Importiamo il caricamento dinamico
import { AuthProvider } from "./AuthContext";
import { PetProvider } from "./PetContext";

// Carichiamo Header, Navbar e OnboardingCheck SOLO sul client
const Header = dynamic(() => import("../components/Header"), { ssr: false });
const Navbar = dynamic(() => import("../components/Navbar"), { ssr: false });
const OnboardingCheck = dynamic(() => import("../components/OnboardingCheck"), {
  ssr: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="antialiased bg-[#FDFBF7] min-h-screen flex flex-col">
        <AuthProvider>
          <OnboardingCheck>
            <PetProvider>
              <Header />
              <main className="flex-1 pt-24 pb-24 px-4 w-full max-w-md mx-auto">
                {children}
              </main>
              <Navbar />
            </PetProvider>
          </OnboardingCheck>
        </AuthProvider>
      </body>
    </html>
  );
}

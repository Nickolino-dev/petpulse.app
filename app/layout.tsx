"use client";

import "./globals.css";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { PetProvider } from "./PetContext";
import { AuthProvider } from "./AuthContext";
// Rimosso ProtectRoute perché OnboardingCheck è già il nostro guardiano
import OnboardingCheck from "../components/OnboardingCheck";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="antialiased bg-[#FDFBF7] min-h-screen flex flex-col">
        <AuthProvider>
          {/* OnboardingCheck ora gestisce da solo la sicurezza e i redirect */}
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

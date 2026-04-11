"use client";

import "./globals.css";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { PetProvider } from "./PetContext"; // Importiamo il trasmettitore

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="antialiased bg-[#FDFBF7] min-h-screen flex flex-col">
        <PetProvider>
          {/* Inizia la trasmissione qui! */}
          <Header />
          <main className="flex-1 pt-24 pb-24 px-4 w-full max-w-md mx-auto">
            {children}
          </main>
          <Navbar />
        </PetProvider>
      </body>
    </html>
  );
}

"use client";
import { useAuth } from "../app/AuthContext";
import Auth from "./Auth";

export default function ProtectRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <span className="text-4xl mb-4 animate-bounce">🐕</span>
        <div className="text-[#2D4A3E] font-bold text-sm animate-pulse tracking-widest uppercase">
          Annusando le tracce...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <>{children}</>;
}

"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError("Credenziali non valide o errore di rete.");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
      <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-[#E67E70]/10 border-2 border-[#E67E70] rounded-full flex items-center justify-center text-3xl mb-4">
            🐾
          </div>
          <h1 className="text-2xl font-black text-[#2D4A3E]">
            {isLogin ? "Bentornato!" : "Unisciti al Branco"}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin
              ? "Accedi per fiutare i nuovi post"
              : "Crea un account per iniziare a postare"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-xs font-medium p-3 rounded-2xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Il tuo indirizzo email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70]"
          />
          <input
            type="password"
            placeholder="La tua password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E67E70] text-white py-3 rounded-2xl font-bold text-sm mt-2 disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-[#E67E70]/30"
          >
            {loading ? "Caricamento..." : isLogin ? "Accedi" : "Registrati"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#2D4A3E] text-xs font-bold hover:underline"
          >
            {isLogin
              ? "Non hai un account? Registrati"
              : "Hai già un account? Accedi"}
          </button>
        </div>
      </div>
    </div>
  );
}

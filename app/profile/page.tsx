"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../AuthContext";

export default function Profilo() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    pet_name: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (data) {
      setProfile(data);
      setFormData({
        username: data.username || "",
        pet_name: data.pet_name || "",
        bio: data.bio || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: formData.username,
        pet_name: formData.pet_name,
        bio: formData.bio,
      })
      .eq("id", user?.id);

    setSaving(false);

    if (error) {
      console.error("Errore aggiornamento profilo:", error.message || error);
      alert("Errore durante il salvataggio. Controlla i permessi RLS!");
    } else {
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#2D4A3E] font-bold animate-pulse">
        Fiutando il profilo... 🐾
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col items-center w-full animate-in fade-in duration-300">
        <h1 className="text-2xl font-black text-[#2D4A3E] mb-6">
          Modifica Profilo
        </h1>
        <form
          onSubmit={handleSave}
          className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4"
        >
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Username Padrone
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Nome del Pet
            </label>
            <input
              type="text"
              name="pet_name"
              value={formData.pet_name}
              onChange={(e) =>
                setFormData({ ...formData, pet_name: e.target.value })
              }
              className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70] resize-none h-24"
            ></textarea>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#E67E70] text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-[#E67E70]/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const avatarLetter = profile?.username
    ? profile.username[0].toUpperCase()
    : "U";

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Profilo */}
      <div className="mt-6 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full bg-[#E67E70]/20 flex items-center justify-center text-5xl mb-4 shadow-sm border-4 border-white overflow-hidden text-[#E67E70]">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-black">{avatarLetter}</span>
          )}
        </div>

        {/* Info Bio */}
        <h1 className="font-black text-3xl text-[#2D4A3E] tracking-tight">
          {profile?.pet_name || "Il mio Pet"}
        </h1>
        <p className="text-[#2D4A3E]/60 text-sm mt-2 font-medium text-center px-4">
          {profile?.bio ||
            "Nessuna bio inserita. Clicca su impostazioni per aggiungerla!"}
        </p>
      </div>

      {/* Statistiche (Grid) */}
      <div className="grid grid-cols-3 gap-3 w-full mt-10">
        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#2D4A3E]/5">
          <span className="font-black text-2xl text-[#2D4A3E]">15</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Post
          </span>
        </div>
        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#2D4A3E]/5">
          <span className="font-black text-2xl text-[#2D4A3E]">42</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Amici
          </span>
        </div>
        <div className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#2D4A3E]/5">
          <span className="font-black text-2xl text-[#2D4A3E]">128</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Zampate
          </span>
        </div>
      </div>

      {/* Logout/Settings */}
      <button
        onClick={() => setIsEditing(true)}
        className="mt-16 px-6 py-3 text-gray-400 text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-black/5 transition-colors active:scale-95"
      >
        ⚙️ Impostazioni
      </button>
    </div>
  );
}

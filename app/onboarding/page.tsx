"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../AuthContext";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user, profile, refetchProfile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: "",
    pet_name: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        pet_name:
          profile.pet_name === "Il mio Pet" || profile.pet_name === "Nuovo Pet"
            ? ""
            : profile.pet_name || "",
        bio: profile.bio || "",
      });
      setPreviewUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    let avatarUrl = profile?.avatar_url;

    if (file) {
      // Usiamo l'ID dell'utente per sovrascrivere l'immagine vecchia
      const fileName = `${user.id}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        alert("Errore nel caricamento dell'avatar.");
        setSaving(false);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      // Aggiriamo la cache del browser
      avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: formData.username,
        pet_name: formData.pet_name,
        bio: formData.bio,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    setSaving(false);

    if (!error) {
      alert("Profilo completato! Benvenuto nel branco!");
      refetchProfile(); // Aggiorna il profilo globale istantaneamente
      router.push("/");
    } else {
      alert("Errore durante il salvataggio del profilo.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4">
      <div className="w-full max-w-md animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#2D4A3E]">
            Benvenuto su PetPulse! Raccontaci del tuo pet
          </h1>
          <p className="text-gray-500 mt-2">Manca poco per unirti al branco!</p>
        </div>

        <form
          onSubmit={handleSave}
          className="w-full bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col gap-4"
        >
          <div className="flex flex-col items-center">
            <div
              className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-4 overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                "📷"
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-gray-400">Clicca per cambiare foto</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Il tuo nome (o nickname)
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70]"
              placeholder="Es. nico99"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Nome del tuo Pet
            </label>
            <input
              type="text"
              name="pet_name"
              value={formData.pet_name}
              onChange={(e) =>
                setFormData({ ...formData, pet_name: e.target.value })
              }
              required
              className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70]"
              placeholder="Es. Thor"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Una piccola bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-[#2D4A3E] focus:outline-none focus:ring-2 focus:ring-[#E67E70] resize-none h-24"
              placeholder="Racconta qualcosa di te e del tuo pet..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#E67E70] text-white py-3 rounded-2xl font-bold text-sm mt-4 shadow-lg shadow-[#E67E70]/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Inizia l'avventura!"}
          </button>
        </form>
      </div>
    </div>
  );
}

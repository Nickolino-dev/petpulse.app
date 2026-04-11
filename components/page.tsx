"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../AuthContext";

export default function UserProfile() {
  const { refetchProfile } = useAuth();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ pet_name: "", bio: "" });

  useEffect(() => {
    async function fetchProfileAndPosts() {
      // Recupero utente diretto e assoluto
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }
      setSessionUser(user);

      // Fetch profilo dell'utente loggato
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Fetch posts dell'utente loggato
      const { data: postsData } = await supabase
        .from("posts")
        .select("*, profiles(username, pet_name, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (profileData) {
        setProfile(profileData);
        setFormData({
          pet_name: profileData.pet_name || "",
          bio: profileData.bio || "",
        });
      }
      if (postsData) setPosts(postsData);
      setLoading(false);
    }

    fetchProfileAndPosts();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        pet_name: formData.pet_name,
        bio: formData.bio,
      })
      .eq("id", sessionUser?.id);

    setSaving(false);

    if (error) {
      console.error("Errore aggiornamento profilo:", error.message || error);
      alert("Errore durante il salvataggio.");
    } else {
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      refetchProfile(); // Mantiene i dati sincronizzati globalmente (es. Header)
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#2D4A3E] font-bold animate-pulse">
        Fiutando il profilo... 🐾
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10 text-gray-500">
        Profilo non trovato.
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col items-center w-full animate-in fade-in duration-300">
        <h1 className="text-2xl font-black text-[#2D4A3E] mb-6">
          Modifica Profilo Rapida
        </h1>
        <form
          onSubmit={handleSave}
          className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4"
        >
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
              required
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

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-300">
      {/* Header Profilo */}
      <div className="flex flex-col items-center mb-6 bg-white p-6 rounded-[32px] shadow-sm border border-[#2D4A3E]/5 relative">
        <div className="w-24 h-24 rounded-full bg-[#E67E70] flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-md mb-4 border-4 border-white">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            (profile.pet_name || "P")[0].toUpperCase()
          )}
        </div>
        <h1 className="text-2xl font-black text-[#2D4A3E] tracking-tight">
          {profile.pet_name || "Pet"}
        </h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
          di {profile.username || "Utente"}
        </p>
        <p className="text-[#2D4A3E]/80 text-sm mt-3 text-center max-w-[250px]">
          {profile.bio || "Nessuna bio inserita."}
        </p>

        <button
          onClick={() => setIsEditing(true)}
          className="mt-5 px-6 py-2 bg-gray-50 border border-gray-200 text-[#2D4A3E] text-xs font-bold rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
        >
          Modifica Profilo
        </button>
      </div>

      <div className="mb-3 px-1 flex items-center justify-between">
        <h2 className="text-sm font-black text-[#2D4A3E] uppercase tracking-wide">
          I Miei Ululati
        </h2>
        <span className="text-xs font-bold text-gray-400">
          {posts.length} post
        </span>
      </div>

      {/* Griglia Stile Instagram */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 w-full">
          {posts.map((post) => (
            <div
              key={post.id}
              className="aspect-square bg-gray-100 relative overflow-hidden group cursor-pointer"
            >
              {post.image ? (
                <img
                  src={post.image}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  alt="Post"
                />
              ) : (
                <div className="p-2 w-full h-full flex items-center justify-center text-[10px] text-[#2D4A3E] text-center bg-[#E67E70]/10 font-medium">
                  {post.caption?.length > 40
                    ? post.caption.substring(0, 40) + "..."
                    : post.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-10">
          Nessun ululato da mostrare. 🐾
        </p>
      )}
    </div>
  );
}

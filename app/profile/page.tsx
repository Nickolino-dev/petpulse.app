"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { supabase } from "../../lib/supabase";
import PetCard from "../../components/PetCard";
import FollowList from "../../components/FollowList";
import { useAuth } from "../AuthContext";
import { useSearchParams, useRouter } from "next/navigation";

function ProfileContent() {
  const { user, refetchProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlId = searchParams?.get("id");

  const targetId = urlId || user?.id;
  const isOwnProfile = user?.id === targetId;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ pet_name: "", bio: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stati per Follower
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followListType, setFollowListType] = useState<
    "followers" | "following" | null
  >(null);

  useEffect(() => {
    if (!user || !targetId) return;

    async function fetchProfileAndPosts() {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetId)
          .single();

        const { data: postsData } = await supabase
          .from("posts")
          .select("*, profiles(username, pet_name, avatar_url)")
          .eq("user_id", targetId)
          .order("created_at", { ascending: false });

        const { count: followers } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetId);

        const { count: following } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetId);

        if (profileData) {
          setProfile(profileData);
          if (isOwnProfile) {
            setFormData({
              pet_name: profileData.pet_name || "",
              bio: profileData.bio || "",
            });
          }
        }

        setPosts(postsData || []);
        setFollowersCount(followers || 0);
        setFollowingCount(following || 0);

        if (!isOwnProfile) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", targetId)
            .maybeSingle();

          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error("Errore fetchProfileAndPosts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndPosts();
  }, [user, targetId, isOwnProfile]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    if (!e.target.files || e.target.files.length === 0) return;
    if (!user) {
      alert("Sessione non valida, effettua di nuovo l'accesso.");
      return;
    }
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("L'immagine è troppo grande! Dimensione massima 5MB.");
      return;
    }

    setSaving(true);
    const fileExt = selectedFile.name.split(".").pop() || "png";
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, selectedFile, { upsert: true });

    if (uploadError) {
      console.error("Errore upload avatar:", uploadError);
      alert("Errore nel caricamento dell'immagine.");
      setSaving(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", user.id);

    setProfile((prev: any) => ({ ...prev, avatar_url: newAvatarUrl }));
    refetchProfile();
    setSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        pet_name: formData.pet_name,
        bio: formData.bio,
      })
      .eq("id", user?.id);

    setSaving(false);

    if (error) {
      console.error("Errore aggiornamento profilo:", error.message || error);
      alert("Errore durante il salvataggio.");
    } else {
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      refetchProfile();
    }
  };

  const handleToggleFollow = async () => {
    if (!user || isOwnProfile) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetId);

        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetId });

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Errore durante l'azione di Follow:", error);
    } finally {
      setFollowLoading(false);
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

  if (isEditing && isOwnProfile) {
    return (
      <div className="flex flex-col items-center w-full animate-in fade-in duration-300">
        <h1 className="text-2xl font-black text-[#2D4A3E] mb-6">
          Modifica Profilo Rapida
        </h1>
        <form
          onSubmit={handleSave}
          className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4"
        >
          <div className="flex flex-col items-center mb-2">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl overflow-hidden relative border-2 border-[#E67E70]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                "📷"
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-bold text-[#E67E70] hover:underline"
            >
              Cambia Foto
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
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
            (profile.pet_name?.[0] || "P").toUpperCase()
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

        {/* Statistiche dei Seguiti/Follower */}
        <div className="flex justify-center gap-8 mt-6 w-full px-4 border-t border-gray-50 pt-5">
          <div className="flex flex-col items-center">
            <span className="font-black text-lg text-[#2D4A3E]">
              {posts?.length || 0}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Post
            </span>
          </div>
          <div
            className="flex flex-col items-center cursor-pointer active:scale-95 hover:opacity-70 transition-all"
            onClick={() => setFollowListType("followers")}
          >
            <span className="font-black text-lg text-[#2D4A3E]">
              {followersCount}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Follower
            </span>
          </div>
          <div
            className="flex flex-col items-center cursor-pointer active:scale-95 hover:opacity-70 transition-all"
            onClick={() => setFollowListType("following")}
          >
            <span className="font-black text-lg text-[#2D4A3E]">
              {followingCount}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Seguiti
            </span>
          </div>
        </div>

        {isOwnProfile ? (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-6 px-8 py-2 bg-gray-50 border border-gray-200 text-[#2D4A3E] text-xs font-bold rounded-xl hover:bg-gray-100 active:scale-95 transition-all w-full max-w-[200px]"
          >
            Modifica Profilo
          </button>
        ) : (
          <div className="flex gap-2 mt-6 w-full max-w-[250px]">
            <button
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`flex-1 py-2 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm disabled:opacity-50 ${
                isFollowing
                  ? "bg-gray-100 text-[#2D4A3E] border border-gray-200"
                  : "bg-[#E67E70] text-white shadow-[#E67E70]/30"
              }`}
            >
              {followLoading
                ? "Attendere..."
                : isFollowing
                  ? "Segui già"
                  : "Segui"}
            </button>
            <button
              onClick={() => router.push(`/chat/${targetId}`)}
              className="flex-1 bg-[#2D4A3E] text-white py-2 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm shadow-[#2D4A3E]/30"
            >
              Messaggio
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 px-1 flex items-center justify-between">
        <h2 className="text-sm font-black text-[#2D4A3E] uppercase tracking-wide">
          {isOwnProfile
            ? "I Miei Ululati"
            : `Ululati di ${profile.pet_name || "questo pet"}`}
        </h2>
      </div>

      {/* Griglia Stile Instagram */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 w-full">
          {posts.map((post) => (
            <div
              key={post.id}
              className="aspect-square bg-gray-100 relative overflow-hidden group cursor-pointer"
            >
              {post.image || post.image_url ? (
                <img
                  src={post.image || post.image_url}
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

      {/* Modal FollowList */}
      {followListType && targetId && (
        <FollowList
          userId={targetId}
          type={followListType}
          onClose={() => setFollowListType(null)}
        />
      )}
    </div>
  );
}

export default function UserProfile() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-[#2D4A3E] font-bold animate-pulse">
          Fiutando il profilo... 🐾
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

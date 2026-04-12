"use client";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "../../lib/supabase";
import PetCard from "../../components/PetCard";
import FollowList from "../../components/FollowList";
import { useAuth } from "../AuthContext";
import { useSearchParams } from "next/navigation";

function ProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlId = searchParams?.get("id");
  const profileId = urlId || user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followListType, setFollowListType] = useState<
    "followers" | "following" | null
  >(null);

  const isOwnProfile = user?.id === profileId;

  useEffect(() => {
    async function fetchProfileAndPosts() {
      if (!profileId) return;

      // Fetch profilo
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      // Fetch posts dell'utente
      const { data: postsData } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      // Fetch Followers
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileId);

      // Fetch Following
      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileId);

      if (profileData) {
        setProfile(profileData);
      }
      if (postsData) setPosts(postsData);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      if (user && !isOwnProfile) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profileId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }
      setLoading(false);
    }

    fetchProfileAndPosts();
  }, [profileId, user, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!user || isOwnProfile) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileId);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: profileId });
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

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-300">
      {/* Header Profilo */}
      <div className="flex flex-col items-center mb-8 bg-white p-6 rounded-[32px] shadow-sm border border-[#2D4A3E]/5">
        <div className="w-24 h-24 rounded-full bg-[#E67E70] flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-md mb-4 border-4 border-white">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            (profile.username || "U")[0].toUpperCase()
          )}
        </div>
        <h1 className="text-2xl font-black text-[#2D4A3E] tracking-tight">
          {profile.pet_name || "Pet"} & {profile.username || "Utente"}
        </h1>
        {profile.bio && (
          <p className="text-[#2D4A3E]/70 text-sm mt-2 text-center">
            {profile.bio}
          </p>
        )}

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
          <button
            onClick={handleToggleFollow}
            disabled={followLoading}
            className={`mt-6 px-8 py-2 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm disabled:opacity-50 w-full max-w-[200px] ${
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
      {followListType && (
        <FollowList
          userId={profileId}
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

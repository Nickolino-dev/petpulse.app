"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

interface FollowListProps {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}

export default function FollowList({ userId, type, onClose }: FollowListProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const queryColumn =
          type === "followers" ? "following_id" : "follower_id";
        const targetColumn =
          type === "followers" ? "follower_id" : "following_id";

        const { data: followsData, error } = await supabase
          .from("follows")
          .select(targetColumn)
          .eq(queryColumn, userId);

        if (error) throw error;

        if (followsData && followsData.length > 0) {
          const targetIds = followsData.map((f: any) => f[targetColumn]);

          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, pet_name, avatar_url, bio")
            .in("id", targetIds);

          if (profilesError) throw profilesError;

          setUsers(profilesData || []);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Errore nel recupero della lista:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#2D4A3E]/60 backdrop-blur-sm p-2 sm:p-0">
      {/* Sfondo cliccabile per chiudere */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md h-[70vh] bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl sm:mb-10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2D4A3E]/10 bg-white rounded-t-3xl sm:rounded-t-3xl">
          <h2 className="text-lg font-black text-[#2D4A3E]">
            {type === "followers" ? "Follower" : "Seguiti"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#2D4A3E] font-bold p-2 active:scale-95 transition-transform bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {loading ? (
            <div className="text-center py-10 text-[#2D4A3E] font-bold animate-pulse">
              Fiutando i contatti... 🐾
            </div>
          ) : users.length > 0 ? (
            users.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  onClose();
                  router.push(`/profile?id=${u.id}`);
                }}
                className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#E67E70] flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (u.pet_name?.[0] || "P").toUpperCase()
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="text-[#2D4A3E] font-black text-sm truncate">
                    {u.pet_name || "Pet Sconosciuto"}
                  </h3>
                  <p className="text-gray-400 text-xs truncate">
                    di {u.username || "Utente"}
                  </p>
                  {u.bio && (
                    <p className="text-[#2D4A3E]/60 text-xs truncate mt-0.5">
                      {u.bio}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm italic">
              Nessun contatto in questa lista.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

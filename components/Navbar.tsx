"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddPost from "./AddPost";
import { useAuth } from "../app/AuthContext";
import { supabase } from "../lib/supabase";
import { Home, Map, Bell, User } from "lucide-react"; // Importa le icone per un look pro

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!error && isMounted) {
          setUnreadCount(count || 0);
        }
      } catch (err) {
        console.error("Errore fetch notifiche:", err);
      }
    };

    fetchUnreadCount();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `navbar-notif-${user.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (isMounted) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [pathname]);

  const NavItem = ({ href, icon, label, badge }: any) => {
    const isActive =
      href === "/" ? pathname === "/" : pathname?.startsWith(href);

    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-1 relative transition-all duration-300 ${
          isActive ? "text-[#E67E70]" : "text-gray-400"
        }`}
      >
        <div
          className={`transition-transform duration-300 ${isActive ? "scale-110" : "scale-100"}`}
        >
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </span>

        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E67E70] text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#FDFBF7] animate-pulse shadow-sm">
            {badge > 9 ? "9+" : badge}
          </div>
        )}
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 bg-white border-t border-gray-100 flex justify-around items-center px-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
      <NavItem href="/" icon={<Home size={24} />} label="Home" />

      {/* Sostituita la Chat con la Mappa */}
      <NavItem href="/map" icon={<Map size={24} />} label="Mappa" />

      {/* Il tasto centrale AddPost rimane com'è perché è già perfetto */}
      <div className="relative -mt-10">
        <AddPost />
      </div>

      <NavItem
        href="/notifications"
        icon={<Bell size={24} />}
        label="Avvisi"
        badge={unreadCount}
      />

      <NavItem href="/profile" icon={<User size={24} />} label="Profilo" />
    </nav>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddPost from "./AddPost";
import { useAuth } from "../app/AuthContext";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    // 1. Carica il conteggio iniziale
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

    // 2. Configurazione Realtime in CATENA (Cruciale per evitare l'errore .on() after .subscribe())
    // Puliamo eventuali residui prima di iniziare
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Il timestamp garantisce che il canale sia SEMPRE unico, aggirando l'errore "after subscribe()"
    const channelName = `navbar-notif-${user.id}-${Date.now()}`;
    console.log("Debug Realtime: Inizializzazione canale", channelName);

    // Creiamo, configuriamo e sottoscriviamo in un unico blocco atomico
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
            console.log("Debug Realtime: Notifica ricevuta!");
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe((status) => {
        console.log("Debug Realtime: Stato connessione =", status);
        if (status === "SUBSCRIBED") {
          console.log("Debug Realtime: In ascolto di nuove notifiche!");
        }
      });

    channelRef.current = channel;

    // Cleanup: spegniamo tutto quando il componente "muore" o cambia utente
    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Usiamo l'ID come dipendenza sicura

  // Reset del pallino quando entri nella pagina notifiche
  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [pathname]);

  const NavItem = ({ href, icon, label, badge }: any) => {
    const isActive = href.startsWith("/profile")
      ? pathname?.startsWith("/profile")
      : pathname === href;

    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-1 text-[10px] relative transition-all duration-300 ${
          isActive
            ? "text-[#2D4A3E] font-black scale-105"
            : "text-gray-400 font-medium"
        }`}
      >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>

        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#FDFBF7] animate-pulse shadow-sm">
            {badge > 9 ? "9+" : badge}
          </div>
        )}

        {isActive && (
          <div className="absolute -bottom-3 w-1 h-1 rounded-full bg-[#2D4A3E]"></div>
        )}
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 bg-[#FDFBF7] border-t border-[#2D4A3E]/10 flex justify-around items-center px-2 z-50 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
      <NavItem href="/" icon="🏠" label="HOME" />
      <NavItem href="/chat" icon="💬" label="CHAT" />

      <div className="relative -mt-8">
        <AddPost />
      </div>

      <NavItem
        href="/notifications"
        icon="🔔"
        label="AVVISI"
        badge={unreadCount}
      />
      <NavItem href="/profile" icon="👤" label="PROFILO" />
    </nav>
  );
}

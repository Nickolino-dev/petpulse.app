"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddPost from "./AddPost";

export default function Navbar() {
  const pathname = usePathname();

  const NavItem = ({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: string;
    label: string;
  }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-1 text-[10px] relative transition-colors ${
          isActive ? "text-[#2D4A3E] font-black" : "text-gray-400 font-medium"
        }`}
      >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
        {/* Pallino indicatore pagina attiva */}
        {isActive && (
          <div className="absolute -bottom-3 w-1 h-1 rounded-full bg-[#2D4A3E]"></div>
        )}
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 bg-[#FDFBF7] border-t border-[#2D4A3E]/10 flex justify-around items-center px-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <NavItem href="/" icon="🏠" label="HOME" />
      <NavItem href="/mappe" icon="📍" label="MAPPE" />

      {/* Tasto Centrale Aggiungi */}
      <div className="relative -mt-4">
        <AddPost />
      </div>

      <NavItem href="/servizi" icon="🩺" label="SERVIZI" />
      <NavItem href="/profilo" icon="👤" label="PROFILO" />
    </nav>
  );
}

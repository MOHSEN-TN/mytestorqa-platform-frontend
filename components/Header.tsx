"use client";

import { Settings, User, Plus, Search, X, User2 } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  FolderKanban,
  CheckSquare,
  Play,
  Bug,
  BarChart2,
  Bot,
} from "lucide-react";

const modules = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Vue d'ensemble de la plateforme" },
  { href: "/users", label: "Users", icon: User2, description: "Gestion des utilisateur" },
  { href: "/auth", label: "Auth", icon: Lock, description: "Authentification et sécurité" },
  { href: "/projects", label: "Project", icon: FolderKanban, description: "Gestion des projets" },
  { href: "/test-cases", label: "Cas de test", icon: CheckSquare, description: "Gestion des cas de test" },
  { href: "/runs", label: "Exécution", icon: Play, description: "Exécution des tests" },
  { href: "/bugs", label: "Bugs", icon: Bug, description: "Suivi des bugs" },
  { href: "/reports", label: "Rapports", icon: BarChart2, description: "Rapports et statistiques" },
  { href: "/ia", label: "Agent IA", icon: Bot, description: "Assistant IA intelligent" },
];

export default function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? modules.filter(
        (m) =>
          m.label.toLowerCase().includes(query.toLowerCase()) ||
          m.description.toLowerCase().includes(query.toLowerCase())
      )
    : modules;

  // Fermer si on clique à l'extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (href: string) => {
    router.push(href);
    setQuery("");
    setOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 gap-4">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800 shrink-0">Dashboard</h1>

      {/* Search with dropdown */}
      <div ref={ref} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="w-full rounded-full border border-gray-200 pl-9 pr-8 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setOpen(true); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-3">Aucun module trouvé.</p>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">
                  Modules
                </p>
                {filtered.map(({ href, label, icon: Icon, description }) => (
                  <button
                    key={href}
                    onClick={() => handleSelect(href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} />
          Nouveau test
        </button>
        <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
          <Settings size={16} />
        </button>
        <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
          <User size={16} />
        </button>
        <LogoutButton />
      </div>
    </header>
  );
}
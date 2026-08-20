"use client";

import { Settings, Search, X, User2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import UserAccountMenu from "./UserAccountMenu";
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

type ModuleItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  description: string;
  adminOnly?: boolean;
};

const modules: ModuleItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble de la plateforme",
  },
 
  {
    href: "/users",
    label: "Users",
    icon: User2,
    description: "Gestion des utilisateurs",
    adminOnly: true,
  },
  {
    href: "/projects",
    label: "Project",
    icon: FolderKanban,
    description: "Gestion des projets",
  },
  {
    href: "/test-cases",
    label: "Cas de test",
    icon: CheckSquare,
    description: "Gestion des cas de test",
  },
  {
    href: "/runs",
    label: "Exécution",
    icon: Play,
    description: "Exécution des tests",
  },
  {
    href: "/bugs",
    label: "Bugs",
    icon: Bug,
    description: "Suivi des bugs",
  },
  {
    href: "/reports",
    label: "Rapports",
    icon: BarChart2,
    description: "Rapports et statistiques",
  },
  {
    href: "/ai-agent",
    label: "Agent IA",
    icon: Bot,
    description: "Assistant IA intelligent",
  },
];

export default function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("http://localhost:3001/auth/me", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.role) {
          setCurrentRole(data.role);
        }
      })
      .catch(() => {
        setCurrentRole(null);
      });
  }, []);

  const allowedModules = modules.filter((module) => {
    if (module.adminOnly && currentRole !== "ADMIN") {
      return false;
    }

    return true;
  });

  const filtered = query.trim()
    ? allowedModules.filter(
        (module) =>
          module.label.toLowerCase().includes(query.toLowerCase()) ||
          module.description.toLowerCase().includes(query.toLowerCase()),
      )
    : allowedModules;

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
    router.push(`/${locale}${href}`);
    setQuery("");
    setOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 gap-4">
      <h1 className="text-xl font-bold text-gray-800 shrink-0">Dashboard</h1>

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
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(true);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-3">
                Aucun module trouvé.
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">
                  Modules
                </p>

                {filtered.map(({ href, label, icon: Icon, description }) => (
                  <button
                    key={href}
                    type="button"
                    onClick={() => handleSelect(href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-slate-600" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {label}
                      </p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
       

        <button
          type="button"
          onClick={() => router.push(`/${locale}/settings`)}
          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          title="Paramètres"
        >
          <Settings size={16} />
        </button>

        <UserAccountMenu />
      </div>
    </header>
  );
}
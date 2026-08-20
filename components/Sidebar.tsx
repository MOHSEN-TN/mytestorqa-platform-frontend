"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  User,
  FolderKanban,
  CheckSquare,
  Play,
  Bug,
  BarChart2,
  Bot,
  Settings,
} from "lucide-react";

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const sidebarItems: SidebarItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  
  {
    href: "/users",
    label: "User",
    icon: User,
    adminOnly: true,
  },
  {
    href: "/projects",
    label: "Project",
    icon: FolderKanban,
  },
  {
    href: "/test-cases",
    label: "Cas de test",
    icon: CheckSquare,
  },
  {
    href: "/runs",
    label: "Exécution",
    icon: Play,
  },
  {
    href: "/bugs",
    label: "Bugs",
    icon: Bug,
  },
  {
    href: "/reports",
    label: "Rapports",
    icon: BarChart2,
  },
  {
    href: "/ai-agent",
    label: "Agent IA",
    icon: Bot,
  },
  {
    href: "/settings",
    label: "Paramètres",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [currentRole, setCurrentRole] = useState<string | null>(null);

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

  const visibleItems = sidebarItems.filter((item) => {
    if (item.adminOnly && currentRole !== "ADMIN") {
      return false;
    }

    return true;
  });

  return (
    <aside className="w-52 min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="px-6 py-6">
        <h1 className="text-xl font-bold">MyTester</h1>
        <p className="text-xs text-slate-400">SMART QA Platform</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const fullHref = `/${locale}${href}`;
          const active =
            pathname === fullHref || pathname?.startsWith(`${fullHref}/`);

          return (
            <Link
              key={href}
              href={fullHref}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black border border-slate-700 text-sm font-semibold">
          N
        </div>
      </div>
    </aside>
  );
}
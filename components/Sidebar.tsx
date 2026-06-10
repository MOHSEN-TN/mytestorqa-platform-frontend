"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  FolderKanban,
  CheckSquare,
  Play,
  Bug,
  BarChart2,
  Bot,
  Settings,
  Users,
  ShieldCheck,
  FlaskConical,
  ClipboardList,
  Layers,
  UserCog,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "QA_LEAD" | "TESTER";

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

// ─── Nav configs per role ─────────────────────────────────────────────────────

const navByRole: Record<Role, { section?: string; links: NavLink[] }[]> = {
  ADMIN: [
    {
      section: "Vue générale",
      links: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/reports", label: "Rapports", icon: BarChart2 },
      ],
    },
    {
      section: "Administration",
      links: [
        { href: "/users", label: "Utilisateurs", icon: Users },
        { href: "/auth", label: "Auth & Accès", icon: Lock },
        { href: "/projects", label: "Projets", icon: FolderKanban },
        { href: "/settings", label: "Paramètres", icon: Settings },
      ],
    },
    {
      section: "QA",
      links: [
        { href: "/test-cases", label: "Cas de test", icon: CheckSquare },
        { href: "/runs", label: "Exécutions", icon: Play },
        { href: "/bugs", label: "Bugs", icon: Bug },
        { href: "/ia", label: "Agent IA", icon: Bot },
      ],
    },
  ],

  QA_LEAD: [
    {
      section: "Vue générale",
      links: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/reports", label: "Rapports", icon: BarChart2 },
      ],
    },
    {
      section: "Gestion QA",
      links: [
        { href: "/projects", label: "Projets", icon: FolderKanban },
        { href: "/test-cases", label: "Cas de test", icon: CheckSquare },
        { href: "/runs", label: "Exécutions", icon: Play },
        { href: "/bugs", label: "Bugs", icon: Bug },
      ],
    },
    {
      section: "Équipe",
      links: [
        { href: "/users", label: "Membres", icon: UserCog },
        { href: "/ia", label: "Agent IA", icon: Bot },
      ],
    },
  ],

  TESTER: [
    {
      section: "Vue générale",
      links: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      section: "Mes tâches",
      links: [
        { href: "/test-cases", label: "Cas de test", icon: ClipboardList },
        { href: "/runs", label: "Mes exécutions", icon: FlaskConical },
        { href: "/bugs", label: "Bugs reportés", icon: Bug },
      ],
    },
    {
      section: "Outils",
      links: [
        { href: "/ia", label: "Agent IA", icon: Bot },
        { href: "/settings", label: "Mon profil", icon: Settings },
      ],
    },
  ],
};

// ─── Role badge styles ────────────────────────────────────────────────────────

const roleMeta: Record<Role, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Admin", color: "text-red-300", bg: "bg-red-500/10" },
  QA_LEAD: { label: "QA Lead", color: "text-violet-300", bg: "bg-violet-500/10" },
  TESTER: { label: "Tester", color: "text-emerald-300", bg: "bg-emerald-500/10" },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  role?: Role;
  userName?: string;
}

export default function Sidebar({ role = "TESTER", userName = "Utilisateur" }: SidebarProps) {
  const pathname = usePathname();
  const sections = navByRole[role] ?? navByRole.TESTER;
  const meta = roleMeta[role];

  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={14} className="text-white" />
          </div>
          <p className="text-[15px] font-bold tracking-tight">MyTester</p>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest pl-9">SMART QA Platform</p>
      </div>

      {/* ── User badge ── */}
      <div className="px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-[12px] font-bold text-slate-300">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-slate-200 truncate">{userName}</p>
            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si}>
            {section.section && (
              <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-[1.5px] px-2 mb-1.5">
                {section.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150 ${
                        isActive
                          ? "bg-violet-600 text-white font-medium shadow-sm"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <Icon size={15} className="shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">© {new Date().getFullYear()} MyTester</p>
      </div>
    </aside>
  );
}
// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";

// const links = [
//   { href: "/dashboard", label: "Dashboard" },
//   { href: "/projects", label: "Projects" },
//   { href: "/runs", label: "Runs" },
//   { href: "/test-cases", label: "Test Cases" },
//   { href: "/reports", label: "Reports" },
//   { href: "/settings", label: "Settings" },
//   { href: "/ia", label: "IA" },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();

//   return (
//     <aside className="w-64 min-h-screen bg-slate-900 text-white p-4">
//       <h2 className="text-2xl font-bold mb-8">QA Platform</h2>

//       <nav className="space-y-2">
//         {links.map((link) => {
//           const isActive = pathname.startsWith(link.href);

//           return (
//             <Link
//               key={link.href}
//               href={link.href}
//               className={`block rounded px-3 py-2 transition ${
//                 isActive
//                   ? "bg-white text-black font-semibold"
//                   : "hover:bg-slate-800"
//               }`}
//             >
//               {link.label}
//             </Link>
//           );
//         })}
//       </nav>
//     </aside>
//   );
// }




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
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/auth", label: "Auth", icon: Lock },
  { href: "/projects", label: "Project", icon: FolderKanban },
  { href: "/test-cases", label: "Cas de test", icon: CheckSquare },
  { href: "/runs", label: "Exécution", icon: Play },
  { href: "/bugs", label: "Bugs", icon: Bug },
  { href: "/reports", label: "Rapports", icon: BarChart2 },
  { href: "/ia", label: "Agent IA", icon: Bot },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 min-h-screen bg-slate-900 text-white flex flex-col p-4">
      {/* Brand */}
      <div className="mb-8 px-2">
        <p className="text-lg font-bold leading-tight">MyTester</p>
        <p className="text-xs text-slate-400">SMART QA Platform</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
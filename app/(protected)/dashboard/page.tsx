// export default function DashboardPage() {
//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Dashboard</h2>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="rounded-lg bg-white p-4 shadow-sm border">
//           <p className="text-sm text-gray-500">Projects</p>
//           <p className="text-2xl font-bold">12</p>
//         </div>

//         <div className="rounded-lg bg-white p-4 shadow-sm border">
//           <p className="text-sm text-gray-500">Runs</p>
//           <p className="text-2xl font-bold">48</p>
//         </div>

//         <div className="rounded-lg bg-white p-4 shadow-sm border">
//           <p className="text-sm text-gray-500">Pass Rate</p>
//           <p className="text-2xl font-bold">87%</p>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import { Eye, Edit, X, Plus, Settings, User, ExternalLink } from "lucide-react";

const statCards = [
  { label: "Score qualité", value: "94.2%", accent: "#22c55e" },
  { label: "Auth Module", value: "12 tests", accent: "#a855f7" },
  { label: "Bugs ouverts", value: "23", accent: "#ef4444" },
  { label: "Agent IA", value: "48 tests", accent: "#06b6d4" },
];

const modules = [
  { name: "Auth API", success: "98%", failures: 2, lastRun: "Aujourd'hui" },
  { name: "Payment", success: "72%", failures: 8, lastRun: "Hier" },
  { name: "Dashboard", success: "96%", failures: 1, lastRun: "Aujourd'hui" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: card.accent }}
            />
            <p className="text-sm text-gray-500 mb-1 pl-2">{card.label}</p>
            <p className="text-3xl font-bold text-gray-800 pl-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Module Auth Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Module Auth — cliquez ici
        </h3>
        <p className="text-sm text-gray-400">
          Login, rôles, permissions, MFA, sessions et sécurité utilisateur.
        </p>
      </div>

      {/* Modules Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-gray-500 font-medium">Module</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">Succès</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">Échecs</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">Dernière exécution</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, i) => (
              <tr
                key={mod.name}
                className={i !== modules.length - 1 ? "border-b border-gray-50" : ""}
              >
                <td className="px-6 py-4 font-medium text-gray-700">{mod.name}</td>
                <td className="px-6 py-4 text-gray-600">{mod.success}</td>
                <td className="px-6 py-4 text-gray-600">{mod.failures}</td>
                <td className="px-6 py-4 text-gray-600">{mod.lastRun}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors">
                      <Eye size={14} />
                    </button>
                    <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-colors">
                      <Edit size={14} />
                    </button>
                    <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
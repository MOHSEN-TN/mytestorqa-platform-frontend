"use client";

import { Eye, Edit, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const modules = [
  { name: "Auth API",   success: "98%", failures: 2, lastRunKey: "today"     },
  { name: "Payment",    success: "72%", failures: 8, lastRunKey: "yesterday"  },
  { name: "Dashboard",  success: "96%", failures: 1, lastRunKey: "today"      },
];

export default function DashboardPage() {
  const { t } = useTranslation("dashboard");

  const statCards = [
    { label: t("stats.quality"),    value: "94.2%",   accent: "#22c55e" },
    { label: t("stats.authModule"), value: "12 tests", accent: "#a855f7" },
    { label: t("stats.openBugs"),   value: "23",       accent: "#ef4444" },
    { label: t("stats.aiAgent"),    value: "48 tests", accent: "#06b6d4" },
  ];

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
          {t("authCard.title")}
        </h3>
        <p className="text-sm text-gray-400">
          {t("authCard.description")}
        </p>
      </div>

      {/* Modules Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-gray-500 font-medium">{t("table.module")}</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">{t("table.success")}</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">{t("table.failures")}</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">{t("table.lastRun")}</th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">{t("table.actions")}</th>
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
                <td className="px-6 py-4 text-gray-600">
                  {t(`table.${mod.lastRunKey}`)}
                </td>
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
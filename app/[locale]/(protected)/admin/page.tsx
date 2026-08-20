import { Activity, Construction } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Administration
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Supervision de la plateforme, journaux et paramètres administratifs.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Construction size={26} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-800">
            Module en cours de préparation
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
            Cette page accueillera prochainement les logs système, les traces
            d’activité, les erreurs applicatives et les outils de supervision.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            <Activity size={16} />
            Aucun journal disponible pour le moment
          </div>
        </div>
      </div>
    </div>
  );
}
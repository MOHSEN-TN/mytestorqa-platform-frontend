/* eslint-disable @typescript-eslint/no-explicit-any */
export function StatusBadge({ status, t }: { status: string; t: any }) {
  const map: Record<string, string> = {
    Actif:     "bg-green-100 text-green-700",
    "En cours":"bg-orange-100 text-orange-700",
    Planifié:  "bg-gray-100 text-gray-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-500";
  const label = t(`status.${status}`) ?? status;
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
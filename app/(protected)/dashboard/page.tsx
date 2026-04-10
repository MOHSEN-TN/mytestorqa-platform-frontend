export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Projects</p>
          <p className="text-2xl font-bold">12</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Runs</p>
          <p className="text-2xl font-bold">48</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold">87%</p>
        </div>
      </div>
    </div>
  );
}
// import LogoutButton from "./LogoutButton";

// export default function Header() {
//   return (
//     <header className="h-16 bg-white border-b flex items-center justify-between px-6">
//       <div>
//         <h1 className="text-lg font-semibold">QA Platform</h1>
//       </div>

//       <div className="flex items-center gap-4">
//         <span className="text-sm text-gray-600">Admin</span>
//         <LogoutButton />
//       </div>
//     </header>
//   );
// }
import { Settings, User, Plus } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 gap-4">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800 shrink-0">Dashboard</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Rechercher..."
        className="flex-1 max-w-md rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50"
      />

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
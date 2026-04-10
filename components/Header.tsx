import LogoutButton from "./LogoutButton";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold">QA Platform</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Admin</span>
        <LogoutButton />
      </div>
    </header>
  );
}
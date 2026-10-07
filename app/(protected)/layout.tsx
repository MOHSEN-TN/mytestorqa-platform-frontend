import Header from "@/components/Header";
import ProjectSelectionSync from "@/components/ProjectSelectionSync";
import Sidebar from "@/components/Sidebar";
import ViewerAccessGuard from "@/components/ViewerAccessGuard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Invisible: synchronise le projet actif une seule fois dans la zone protégée. */}
      <ProjectSelectionSync />

      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <ViewerAccessGuard>{children}</ViewerAccessGuard>
        </main>
      </div>
    </div>
  );
}

"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3001/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erreur logout:", error);
    } finally {
      router.replace("/auth");
      router.refresh();
    }
  };

  return (
    <button onClick={handleLogout} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
      <ExternalLink size={16} />
    </button>
  );
}
"use client";

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
    <button
      onClick={handleLogout}
      className="rounded border px-4 py-2 text-sm hover:bg-gray-100"
    >
      Logout
    </button>
  );
}
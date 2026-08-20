"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";

type CurrentUser = {
  userId?: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
};

export default function UserAccountMenu() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("http://localhost:3001/auth/me", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) {
          setCurrentUser(data);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getInitials = () => {
    if (currentUser?.firstName || currentUser?.lastName) {
      return `${currentUser?.firstName?.[0] ?? ""}${
        currentUser?.lastName?.[0] ?? ""
      }`.toUpperCase();
    }

    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }

    return "U";
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "QA_LEAD":
        return "Responsable QA";
      case "TESTER":
        return "Testeur";
      default:
        return role || "-";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3001/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout error
    }

    router.replace(`/${locale}/auth`);
    router.refresh();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        title="Mon compte"
      >
        <User size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-4">
            <p className="text-sm font-semibold text-gray-800">Mon compte</p>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {getInitials()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {currentUser?.firstName || currentUser?.lastName
                    ? `${currentUser?.firstName ?? ""} ${
                        currentUser?.lastName ?? ""
                      }`
                    : "Utilisateur"}
                </p>

                <p className="truncate text-xs text-gray-500">
                  {currentUser?.email || "-"}
                </p>

                <p className="mt-0.5 text-xs font-medium text-blue-600">
                  {getRoleLabel(currentUser?.role)}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/${locale}/profile`);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <User size={16} className="text-gray-400" />
            Profil
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/${locale}/settings`);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Settings size={16} className="text-gray-400" />
            Paramètres
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
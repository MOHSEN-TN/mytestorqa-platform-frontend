"use client";

import { useEffect, useState } from "react";
import { Mail, Shield, UserRound } from "lucide-react";

type CurrentUser = {
  userId?: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/auth/me", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Utilisateur non connecté");
        }

        return res.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Profil</h1>
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Profil</h1>
        <p className="text-sm text-red-500">
          Impossible de charger les informations du profil.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profil</h1>
        <p className="text-sm text-gray-500">
          Informations du compte connecté.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
            {(user.lastName?.[0] || "").toUpperCase()}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {user.firstName || "-"} {user.lastName || ""}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <UserRound size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                Prénom
              </span>
            </div>
            <span className="text-sm text-gray-800">
              {user.firstName || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <UserRound size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Nom</span>
            </div>
            <span className="text-sm text-gray-800">
              {user.lastName || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Email</span>
            </div>
            <span className="text-sm text-gray-800">{user.email}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Rôle</span>
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
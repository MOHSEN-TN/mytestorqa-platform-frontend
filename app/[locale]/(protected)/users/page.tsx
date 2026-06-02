// app/users/page.tsx
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchUsers, createUser, updateUser, deleteUser, setSelectedUser, resetUserPassword,
} from "@/lib/slices/userSlice";
import {
  Eye,
  Edit,
  X,
  CheckCheck,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Key,
  UserPlus,
  Shield,
  Mail,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Modal } from "@/components/projects/Modal";

export default function UsersPage() {
  const { t } = useTranslation("users");
  const dispatch = useAppDispatch();
  const { users, loading, creating, updating, deleting, error, selectedUser, pagination } =
    useAppSelector((s) => s.users);
    console.log("useeeeeeeeer ", users);
    

  const [showNewModal, setShowNewModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userRole, setUserRole] = useState("TESTER");
  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserData, setEditUserData] = useState({ firstName: "", lastName: "", role: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    const timer = setTimeout(() => {
    dispatch(fetchUsers({ search: search || undefined, page, limit })); // Change 'name' to 'search'
    }, 400);
    return () => clearTimeout(timer);
  }, [search, page, limit, dispatch]);

  // Sync redux errors
  useEffect(() => { if (error && showNewModal) setCreateError(error); }, [error, showNewModal]);
  useEffect(() => { if (error && editingUser) setEditError(error); }, [error, editingUser]);

  const closeNewModal = () => {
    setShowNewModal(false);
    setCreateError(null);
    setUserEmail("");
    setUserFirstName("");
    setUserLastName("");
    setUserRole("TESTER");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditUserData({ firstName: "", lastName: "", role: "" });
    setEditError(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (v: number) => {
    setLimit(v);
    setPage(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    
    if (!userEmail.trim() || !userFirstName.trim() || !userLastName.trim()) {
      setCreateError("Tous les champs sont requis");
      return;
    }

    const res = await dispatch(createUser({
      email: userEmail,
      firstName: userFirstName,
      lastName: userLastName,
      role: userRole,
    }));

    if (createUser.fulfilled.match(res)) {
      closeNewModal();
      dispatch(fetchUsers({ page, limit }));
    } else {
      setCreateError((res as any)?.payload?.message || "Erreur lors de la création");
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editingUser) return;

    const res = await dispatch(updateUser({
      userId: editingUser.id,
      data: editUserData,
    }));

    if (updateUser.fulfilled.match(res)) {
      closeEditModal();
      dispatch(fetchUsers({ page, limit }));
    } else {
      setEditError((res as any)?.payload?.message || "Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    const res = await dispatch(deleteUser(id));
    if (deleteUser.fulfilled.match(res)) {
      dispatch(fetchUsers({ page, limit }));
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Réinitialiser le mot de passe pour ${userEmail} ? Un nouveau mot de passe lui sera envoyé par email.`)) return;
    
    const res = await dispatch(resetUserPassword(userId));
    if (resetUserPassword.fulfilled.match(res)) {
      setResetPasswordSuccess(`Un nouveau mot de passe a été envoyé à ${userEmail}`);
      setTimeout(() => setResetPasswordSuccess(null), 5000);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-purple-100 text-purple-700 border-purple-200";
      case "QA_LEAD": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Administrateur";
      case "QA_LEAD": return "Responsable QA";
      default: return "Testeur";
    }
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, pagination?.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
        <p className="text-sm text-gray-500">Gérer les comptes utilisateurs, rôles et permissions</p>
      </div>

      {/* Success Message */}
      {resetPasswordSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCheck size={16} />
            <p className="text-sm">{resetPasswordSuccess}</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <UserPlus size={15} />Ajouter
        </button>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={handleSearchChange}
            placeholder="Rechercher par email, nom..."
            className="pl-8 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Chargement...</p>
        ) : users?.length === 0 ? (
          <p className="p-6 text-gray-500">
            {search ? `Aucun utilisateur trouvé pour "${search}"` : "Aucun utilisateur"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Utilisateur</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Rôle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user, i) => (
                  <tr key={user.id}
                    className={`transition-colors hover:bg-gray-50 ${i !== users?.length - 1 ? "border-b border-gray-50" : ""} ${selectedUser?.id === user.id ? "bg-blue-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        <Shield size={10} />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => dispatch(setSelectedUser(user))}
                          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors"
                          title="Voir détails">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => {
                          setEditingUser(user);
                          setEditUserData({
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                          });
                          setEditError(null);
                        }}
                          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-colors"
                          title="Modifier">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleResetPassword(user.id, user.email)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-purple-500 hover:border-purple-200 transition-colors"
                          title="Réinitialiser mot de passe">
                          <Key size={14} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} disabled={deleting}
                          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40"
                          title="Supprimer">
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-3 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Afficher</span>
          <select value={limit} onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
            <option value={5}>5 par page</option>
            <option value={10}>10 par page</option>
            <option value={25}>25 par page</option>
            <option value={50}>50 par page</option>
          </select>
          <p className="text-sm text-gray-500">
            {pagination?.total > 0
              ? `${startItem} - ${endItem} sur ${pagination?.total}`
              : "Aucun résultat"}
          </p>
        </div>

        {pagination?.totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={15} />Précédent
            </button>

            {Array.from({ length: pagination?.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination?.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`e-${idx}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`w-8 h-8 text-sm rounded-lg border transition-colors ${page === p ? "bg-blue-600 border-blue-600 text-white font-medium" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {p}
                  </button>
                )
              )}

            <button onClick={() => setPage((p) => Math.min(pagination?.totalPages, p + 1))} disabled={page === pagination?.totalPages}
              className="flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Suivant<ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* New User Modal */}
      <Modal open={showNewModal} onClose={closeNewModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Ajouter un utilisateur</h2>
            <button onClick={closeNewModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={userEmail} onChange={(e) => { setUserEmail(e.target.value); setCreateError(null); }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
                <input type="text" value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
                <input type="text" value={userLastName} onChange={(e) => setUserLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="TESTER">Testeur</option>
                <option value="QA_LEAD">Responsable QA</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            {createError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeNewModal}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
                <X size={14} />Annuler
              </button>
              <button type="submit" disabled={creating}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                {creating ? "Création..." : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editingUser} onClose={closeEditModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">{"Modifier l'utilisateur"}</h2>
            <button onClick={closeEditModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
                <input type="text" value={editUserData.firstName}
                  onChange={(e) => setEditUserData({ ...editUserData, firstName: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                <input type="text" value={editUserData.lastName}
                  onChange={(e) => setEditUserData({ ...editUserData, lastName: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
              <select value={editUserData.role} onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="TESTER">Testeur</option>
                <option value="QA_LEAD">Responsable QA</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            {editError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{editError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeEditModal}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
                <X size={14} />Annuler
              </button>
              <button type="submit" disabled={updating}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                {updating ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
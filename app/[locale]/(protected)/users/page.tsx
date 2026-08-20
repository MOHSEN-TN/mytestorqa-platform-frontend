// app/[locale]/(protected)/users/page.tsx
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  setSelectedUser,
  resetUserPassword,
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
import { Modal } from "@/components/projects/Modal";

type UserRole = "TESTER" | "ADMIN" | "QA_LEAD";

export default function UsersPage() {
  const dispatch = useAppDispatch();

  const usersState = useAppSelector((state) => state.users) as any;

  const {
    users = [],
    loading,
    creating,
    updating,
    deleting,
    resettingPassword,
    error,
    selectedUser,
    pagination = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  } = usersState;

  const [showNewModal, setShowNewModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("TESTER");

  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserData, setEditUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    role: "TESTER",
  });

  const [editError, setEditError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(
    null,
  );

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void dispatch(fetchUsers({ search: search || undefined, page, limit }));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search, page, limit, dispatch]);

  useEffect(() => {
    if (error && showNewModal) {
      setCreateError(error);
    }
  }, [error, showNewModal]);

  useEffect(() => {
    if (error && editingUser) {
      setEditError(error);
    }
  }, [error, editingUser]);

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
    setEditUserData({
      firstName: "",
      lastName: "",
      email: "",
      role: "TESTER",
    });
    setEditError(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);

    if (!userEmail.trim() || !userFirstName.trim() || !userLastName.trim()) {
      setCreateError("Tous les champs sont requis");
      return;
    }

    const result = await dispatch(
      createUser({
        email: userEmail.trim(),
        firstName: userFirstName.trim(),
        lastName: userLastName.trim(),
        role: userRole,
      }),
    );

    if (createUser.fulfilled.match(result)) {
      const payload = result.payload as any;

      if (payload?.temporaryPassword) {
        window.alert(`Mot de passe temporaire : ${payload.temporaryPassword}`);
      } else {
        window.alert("Utilisateur créé avec succès.");
      }

      closeNewModal();
      void dispatch(fetchUsers({ search: search || undefined, page, limit }));
    } else {
      setCreateError(
        (result as any)?.payload?.message || "Erreur lors de la création",
      );
    }
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setEditError(null);

    if (!editingUser) return;

    if (
      !editUserData.firstName.trim() ||
      !editUserData.lastName.trim() ||
      !editUserData.email.trim()
    ) {
      setEditError("Prénom, nom et email sont requis");
      return;
    }

    const result = await dispatch(
      updateUser({
        userId: editingUser.id,
        data: {
          ...editUserData,
          firstName: editUserData.firstName.trim(),
          lastName: editUserData.lastName.trim(),
          email: editUserData.email.trim(),
        },
      }),
    );

    if (updateUser.fulfilled.match(result)) {
      closeEditModal();
      void dispatch(fetchUsers({ search: search || undefined, page, limit }));
    } else {
      setEditError(
        (result as any)?.payload?.message || "Erreur lors de la mise à jour",
      );
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cet utilisateur ?",
    );

    if (!confirmed) return;

    const result = await dispatch(deleteUser(id));

    if (deleteUser.fulfilled.match(result)) {
      void dispatch(fetchUsers({ search: search || undefined, page, limit }));
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `Envoyer un lien de réinitialisation à ${userEmail} ?`,
    );

    if (!confirmed) return;

    setResetPasswordSuccess(null);

    const result = await dispatch(resetUserPassword(userId));

    if (resetUserPassword.fulfilled.match(result)) {
      const payload = result.payload as {
        message?: string;
      };

      setResetPasswordSuccess(
        payload.message ||
          `Un lien de réinitialisation a été envoyé à ${userEmail}.`,
      );

      window.setTimeout(() => {
        setResetPasswordSuccess(null);
      }, 5000);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "QA_LEAD":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "QA_LEAD":
        return "Responsable QA";
      default:
        return "Testeur";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Gestion des Utilisateurs
        </h1>
        <p className="text-sm text-gray-500">
          Gérer les comptes utilisateurs, rôles et permissions
        </p>
      </div>

      {resetPasswordSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCheck size={16} />
            <p className="text-sm">{resetPasswordSuccess}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <UserPlus size={15} />
          Ajouter
        </button>

        <div className="relative ml-auto">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher par email, nom..."
            className="w-64 rounded-lg border border-gray-200 py-2 pl-8 pr-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-gray-500">Chargement...</p>
        ) : users?.length === 0 ? (
          <p className="p-6 text-gray-500">
            {search
              ? `Aucun utilisateur trouvé pour "${search}"`
              : "Aucun utilisateur"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users?.map((user: any, index: number) => (
                  <tr
                    key={user.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      index !== users.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    } ${selectedUser?.id === user.id ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-medium text-white">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>

                        <div>
                          <p className="font-medium text-gray-800">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {user.id?.slice(0, 8)}
                          </p>
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
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${getRoleBadgeColor(
                          user.role,
                        )}`}
                      >
                        <Shield size={10} />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => dispatch(setSelectedUser(user))}
                          className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-blue-200 hover:text-blue-500"
                          title="Voir détails"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(user);
                            setEditUserData({
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email,
                              role: user.role as UserRole,
                            });
                            setEditError(null);
                          }}
                          className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-orange-200 hover:text-orange-500"
                          title="Modifier"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleResetPassword(user.id, user.email)
                          }
                          disabled={resettingPassword}
                          className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-purple-200 hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Envoyer un lien de réinitialisation"
                        >
                          <Key size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting}
                          className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-40"
                          title="Supprimer"
                        >
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

      <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Afficher</span>

          <select
            value={limit}
            onChange={(event) => handleLimitChange(Number(event.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value={5}>5 par page</option>
            <option value={10}>10 par page</option>
            <option value={25}>25 par page</option>
            <option value={50}>50 par page</option>
          </select>

          <p className="text-sm text-gray-500">
            {total > 0
              ? `${startItem} - ${endItem} sur ${total}`
              : "Aucun résultat"}
          </p>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Précédent
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (pageNumber) =>
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  Math.abs(pageNumber - page) <= 1,
              )
              .reduce<(number | "...")[]>((accumulator, pageNumber, index, array) => {
                if (
                  index > 0 &&
                  pageNumber - (array[index - 1] as number) > 1
                ) {
                  accumulator.push("...");
                }

                accumulator.push(pageNumber);
                return accumulator;
              }, [])
              .map((pageNumber, index) =>
                pageNumber === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={pageNumber}
                    onClick={() => setPage(pageNumber as number)}
                    className={`h-8 w-8 rounded-lg border text-sm transition-colors ${
                      page === pageNumber
                        ? "border-blue-600 bg-blue-600 font-medium text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {showNewModal && (
        <Modal open={showNewModal} onClose={closeNewModal}>
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Ajouter un utilisateur
              </h2>

              <button
                type="button"
                onClick={closeNewModal}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Email *
                </label>

                <input
                  type="email"
                  value={userEmail}
                  onChange={(event) => {
                    setUserEmail(event.target.value);
                    setCreateError(null);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Prénom *
                  </label>

                  <input
                    type="text"
                    value={userFirstName}
                    onChange={(event) => setUserFirstName(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Nom *
                  </label>

                  <input
                    type="text"
                    value={userLastName}
                    onChange={(event) => setUserLastName(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Rôle
                </label>

                <select
                  value={userRole}
                  onChange={(event) =>
                    setUserRole(event.target.value as UserRole)
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="TESTER">Testeur</option>
                  <option value="QA_LEAD">Responsable QA</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              {createError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-red-500"
                  />
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeNewModal}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  <X size={14} />
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {editingUser && (
        <Modal open={Boolean(editingUser)} onClose={closeEditModal}>
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Modifier l&apos;utilisateur
              </h2>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Prénom
                  </label>

                  <input
                    type="text"
                    value={editUserData.firstName}
                    onChange={(event) =>
                      setEditUserData({
                        ...editUserData,
                        firstName: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Nom
                  </label>

                  <input
                    type="text"
                    value={editUserData.lastName}
                    onChange={(event) =>
                      setEditUserData({
                        ...editUserData,
                        lastName: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Email
                </label>

                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(event) => {
                    setEditUserData({
                      ...editUserData,
                      email: event.target.value,
                    });
                    setEditError(null);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Rôle
                </label>

                <select
                  value={editUserData.role}
                  onChange={(event) =>
                    setEditUserData({
                      ...editUserData,
                      role: event.target.value as UserRole,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="TESTER">Testeur</option>
                  <option value="QA_LEAD">Responsable QA</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              {editError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-red-500"
                  />
                  <p className="text-sm text-red-600">{editError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  <X size={14} />
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

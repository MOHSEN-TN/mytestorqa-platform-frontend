// lib/user-api.ts
const API_URL = "http://localhost:3001";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'QA_LEAD' | 'TESTER';
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'QA_LEAD' | 'TESTER';
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FetchUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

// Backend response type (what the API actually returns)
interface BackendPaginatedUsers {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getUsers(params: FetchUsersParams = {}): Promise<PaginatedUsers> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.append('search', params.search);
  if (params.page) searchParams.append('page', String(params.page));
  if (params.limit) searchParams.append('limit', String(params.limit));
  
  const url = `${API_URL}/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur récupération des utilisateurs");
  }

  const backendData: BackendPaginatedUsers = await res.json();
  
  // Transform backend response to match expected PaginatedUsers structure
  return {
    items: backendData.data,
    total: backendData.pagination.total,
    page: backendData.pagination.page,
    totalPages: backendData.pagination.totalPages,
  };
}

export async function getUser(userId: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur récupération de l'utilisateur");
  }

  const backendData = await res.json();
  return backendData.data; // Extract the nested data
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur création utilisateur");
  }

  const backendData = await res.json();
  return backendData.data; // Extract the nested data
}

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<User> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur modification utilisateur");
  }

  const backendData = await res.json();
  return backendData.data; // Extract the nested data
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur suppression utilisateur");
  }
}

export async function resetUserPassword(userId: string): Promise<{ message: string; temporaryPassword?: string }> {
  const res = await fetch(`${API_URL}/users/${userId}/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur réinitialisation du mot de passe");
  }

  return res.json();
}
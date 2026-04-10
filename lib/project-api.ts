const API_URL = "http://localhost:3001/projects";

export type User = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export type Member = {
  id: string;
  role: string;
  createdAt: string;
  user: User;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  members: Member[];
};

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(API_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Erreur récupération projets (${res.status})`);
  }

  return res.json();
}

export async function createProject(name: string): Promise<Project> {
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur création projet: ${text}`);
  }

  return res.json();
}

export async function updateProject(id: string, name: string): Promise<Project> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur modification projet: ${text}`);
  }

  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur suppression projet: ${text}`);
  }
}
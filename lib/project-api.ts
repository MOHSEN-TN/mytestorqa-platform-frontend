const API_URL =
  `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"}/projects`;

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
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
  members: Member[];
};

export type ProjectPayload = {
  name: string;
  description?: string;
};

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function getErrorMessage(
  data: unknown,
  fallbackMessage: string,
): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }

  return fallbackMessage;
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(API_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Erreur récupération projets (${response.status})`,
      ),
    );
  }

  return data as Project[];
}

export async function createProject(
  payload: ProjectPayload,
): Promise<Project> {
  const response = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Erreur lors de la création du projet"),
    );
  }

  return data as Project;
}

export async function updateProject(
  id: string,
  payload: ProjectPayload,
): Promise<Project> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Erreur lors de la modification du projet"),
    );
  }

  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Erreur lors de la suppression du projet"),
    );
  }
}

export async function duplicateProject(
  id: string,
): Promise<Project> {
  const response = await fetch(`${API_URL}/${id}/duplicate`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Erreur lors de la duplication du projet"),
    );
  }

  return data as Project;
}
const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export type ProjectImportStatus =
  | "READY"
  | "PROJECT_ALREADY_EXISTS"
  | "INVALID";

export type ProjectImportPreviewItem = {
  projectKey: string;
  name: string;
  status: ProjectImportStatus;
  suites: number;
  testCases: number;
  steps: number;
  message?: string;
};

export type ProjectImportPreview = {
  valid: boolean;
  templateVersion: string | null;
  projectsFound: number;
  suitesFound: number;
  testCasesFound: number;
  stepsFound: number;
  projects: ProjectImportPreviewItem[];
  errors: string[];
};

export type ProjectImportResultItem = {
  projectKey: string;
  name: string;
  projectId: string;
  suites: number;
  testCases: number;
  steps: number;
};

export type ProjectImportSkippedItem = {
  projectKey: string;
  name: string;
  reason: "PROJECT_ALREADY_EXISTS" | "INVALID_PROJECT";
  message: string;
};

export type ProjectImportResult = {
  imported: ProjectImportResultItem[];
  skipped: ProjectImportSkippedItem[];
  errors: string[];
};

type ApiErrorPayload = {
  message?: string | string[];
  errors?: string[];
};

async function parseJsonResponse<T>(
  response: Response,
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Réponse serveur invalide (${response.status}).`,
    );
  }
}

function extractApiError(
  payload: ApiErrorPayload,
  fallback: string,
): string {
  if (Array.isArray(payload.message)) {
    return payload.message.join(" · ");
  }

  if (
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  if (
    Array.isArray(payload.errors) &&
    payload.errors.length > 0
  ) {
    return payload.errors.join(" · ");
  }

  return fallback;
}

export async function exportProjectsXlsx(): Promise<void> {
  const response = await fetch(
    `${API_URL}/projects/transfer/export`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    let payload: ApiErrorPayload = {};

    try {
      payload = await parseJsonResponse<ApiErrorPayload>(
        response,
      );
    } catch {
      // Le fallback ci-dessous reste suffisant.
    }

    throw new Error(
      extractApiError(
        payload,
        "Impossible d’exporter les projets.",
      ),
    );
  }

  const blob = await response.blob();

  const contentDisposition =
    response.headers.get("content-disposition");

  const fileNameMatch = contentDisposition?.match(
    /filename="?([^"]+)"?/i,
  );

  const fileName =
    fileNameMatch?.[1]?.trim() ||
    `MyTester_Projects_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function createImportFormData(file: File): FormData {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

export async function previewProjectImport(
  file: File,
): Promise<ProjectImportPreview> {
  const response = await fetch(
    `${API_URL}/projects/transfer/import/preview`,
    {
      method: "POST",
      credentials: "include",
      body: createImportFormData(file),
    },
  );

  const payload = await parseJsonResponse<
    ProjectImportPreview & ApiErrorPayload
  >(response);

  if (!response.ok) {
    throw new Error(
      extractApiError(
        payload,
        "Impossible d’analyser le fichier d’import.",
      ),
    );
  }

  return payload;
}

export async function importProjectsXlsx(
  file: File,
): Promise<ProjectImportResult> {
  const response = await fetch(
    `${API_URL}/projects/transfer/import`,
    {
      method: "POST",
      credentials: "include",
      body: createImportFormData(file),
    },
  );

  const payload = await parseJsonResponse<
    ProjectImportResult & ApiErrorPayload
  >(response);

  if (!response.ok) {
    throw new Error(
      extractApiError(
        payload,
        "Impossible d’importer les projets.",
      ),
    );
  }

  return payload;
}

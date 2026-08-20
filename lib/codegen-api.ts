const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type CodegenSessionStatus =
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type StartCodegenSessionPayload = {
  url: string;
  testCaseId?: string;
};

export type StartCodegenSessionResponse = {
  sessionId: string;
  status: CodegenSessionStatus;
  processId: number | null;
  url: string;
  testCaseId: string | null;
  message: string;
};

export type CodegenSessionResponse = {
  sessionId: string;
  status: CodegenSessionStatus;
  processId: number | null;
  url: string;
  testCaseId: string | null;
  createdAt: string;
  finishedAt: string | null;
  error: string | null;
  code: string | null;
};

export type ImportCodegenSessionResponse = {
  imported: true;
  sessionId: string;
  testCase: {
    id: string;
    suiteId: string;
    title: string;
    automationFramework: "PLAYWRIGHT";
    automationCode: string;
  };
};

async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }

    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch {
    try {
      const text = await response.text();

      if (text) {
        return text;
      }
    } catch {
      // Ignore parsing errors.
    }
  }

  return fallback;
}

export async function startCodegenSession(
  payload: StartCodegenSessionPayload
): Promise<StartCodegenSessionResponse> {
  const response = await fetch(`${API_URL}/automation/codegen/start`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Impossible de démarrer l’enregistrement Playwright."
      )
    );
  }

  return response.json();
}

export async function getCodegenSessionStatus(
  sessionId: string
): Promise<CodegenSessionResponse> {
  const response = await fetch(
    `${API_URL}/automation/codegen/${encodeURIComponent(
      sessionId
    )}/status`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Impossible de récupérer l’état de l’enregistrement."
      )
    );
  }

  return response.json();
}

export async function importCodegenSession(
  sessionId: string,
  testCaseId?: string
): Promise<ImportCodegenSessionResponse> {
  const response = await fetch(
    `${API_URL}/automation/codegen/${encodeURIComponent(
      sessionId
    )}/import`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        testCaseId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Impossible d’importer le code Playwright."
      )
    );
  }

  return response.json();
}

export async function cancelCodegenSession(
  sessionId: string
): Promise<{
  sessionId: string;
  status: CodegenSessionStatus;
  message: string;
}> {
  const response = await fetch(
    `${API_URL}/automation/codegen/${encodeURIComponent(
      sessionId
    )}/cancel`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Impossible d’annuler l’enregistrement Playwright."
      )
    );
  }

  return response.json();
}

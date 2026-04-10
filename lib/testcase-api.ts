const API_URL = "http://localhost:3001";

export type TestStep = {
  id: string;
  testCaseId: string;
  stepOrder: number;
  action: string;
  expected?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TestCase = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  expected?: string | null;
  status: "DRAFT" | "READY" | "DEPRECATED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  updatedAt: string;
  steps: TestStep[];
};

export type CreateTestCasePayload = {
  title: string;
  description?: string;
  expected?: string;
  status?: "DRAFT" | "READY" | "DEPRECATED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  steps?: Array<{
    action: string;
    expected?: string;
  }>;
};

export async function getTestCases(projectId: string): Promise<TestCase[]> {
  const res = await fetch(`${API_URL}/projects/${projectId}/testcases`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur récupération test cases");
  }

  return res.json();
}

export async function createTestCase(
  projectId: string,
  payload: CreateTestCasePayload,
): Promise<TestCase> {
  const res = await fetch(`${API_URL}/projects/${projectId}/testcases`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur création test case");
  }

  return res.json();
}
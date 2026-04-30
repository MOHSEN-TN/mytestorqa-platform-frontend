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
  suiteId: string;
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

export type UpdateTestCasePayload = {
  title?: string;
  description?: string;
  expected?: string;
  status?: "DRAFT" | "READY" | "DEPRECATED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  steps?: Array<{
    action: string;
    expected?: string;
  }>;
};

export async function getTestCases(suiteId: string): Promise<TestCase[]> {
  const res = await fetch(`${API_URL}/suites/${suiteId}/testcases`, {
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

export async function getTestCase(
  suiteId: string,
  testCaseId: string
): Promise<TestCase> {
  const res = await fetch(
    `${API_URL}/suites/${suiteId}/testcases/${testCaseId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur récupération test case");
  }

  return res.json();
}

export async function createTestCase(
  suiteId: string,
  payload: CreateTestCasePayload
): Promise<TestCase> {
  const res = await fetch(`${API_URL}/suites/${suiteId}/testcases`, {
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

export async function updateTestCase(
  suiteId: string,
  testCaseId: string,
  payload: UpdateTestCasePayload
): Promise<TestCase> {
  const res = await fetch(
    `${API_URL}/suites/${suiteId}/testcases/${testCaseId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur modification test case");
  }

  return res.json();
}

export async function deleteTestCase(
  suiteId: string,
  testCaseId: string
): Promise<void> {
  const res = await fetch(
    `${API_URL}/suites/${suiteId}/testcases/${testCaseId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur suppression test case");
  }
}

export async function duplicateTestCase(
  suiteId: string,
  testCaseId: string
): Promise<TestCase> {
  const res = await fetch(
    `${API_URL}/suites/${suiteId}/testcases/${testCaseId}/duplicate`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur duplication test case");
  }

  return res.json();
}
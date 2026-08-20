const API_URL = "http://localhost:3001";

export type TestSuite = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTestSuitePayload = {
  name: string;
  description?: string;
};

export type UpdateTestSuitePayload = {
  name?: string;
  description?: string;
};

export async function getTestSuites(projectId: string): Promise<TestSuite[]> {
  const res = await fetch(`${API_URL}/projects/${projectId}/suites`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur récupération test suites");
  }

  return res.json();
}

export async function createTestSuite(
  projectId: string,
  payload: CreateTestSuitePayload
): Promise<TestSuite> {
  const res = await fetch(`${API_URL}/projects/${projectId}/suites`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur création test suite");
  }

  return res.json();
}

export async function updateTestSuite(
  suiteId: string,
  payload: UpdateTestSuitePayload
): Promise<TestSuite> {
  const res = await fetch(`${API_URL}/suites/${suiteId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur modification test suite");
  }

  return res.json();
}

export async function deleteTestSuite(suiteId: string): Promise<void> {
  const res = await fetch(`${API_URL}/suites/${suiteId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur suppression test suite");
  }
}

export async function duplicateTestSuite(suiteId: string): Promise<TestSuite> {
  const res = await fetch(`${API_URL}/suites/${suiteId}/duplicate`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur duplication test suite");
  }

  return res.json();
}
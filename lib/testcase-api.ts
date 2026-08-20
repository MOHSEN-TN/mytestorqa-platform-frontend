const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type TestCaseSourceType =
  | "MANUAL"
  | "AI_GENERATED";

export type AIGenerationMode =
  | "RULE_BASED"
  | "OLLAMA_LOCAL"
  | "CLOUD_AI";

export type AutomationFramework =
  | "PLAYWRIGHT"
  | "SELENIUM"
  | "CYPRESS";

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
  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  sourceType?: TestCaseSourceType;
  generationMode?: AIGenerationMode | null;
  automationFramework?: AutomationFramework | null;
  automationCode?: string | null;
  aiSuggestionId?: string | null;

  createdAt: string;
  updatedAt: string;
  steps: TestStep[];
};

export type CreateTestCasePayload = {
  title: string;
  description?: string;
  expected?: string;
  status?: "DRAFT" | "READY" | "DEPRECATED";
  priority?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  steps?: Array<{
    action: string;
    expected?: string;
  }>;

  sourceType?: TestCaseSourceType;
  generationMode?: AIGenerationMode | null;
  automationFramework?: AutomationFramework | null;
  automationCode?: string | null;
};

export type UpdateTestCasePayload = {
  title?: string;
  description?: string;
  expected?: string;
  status?: "DRAFT" | "READY" | "DEPRECATED";
  priority?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  steps?: Array<{
    action: string;
    expected?: string;
  }>;

  sourceType?: TestCaseSourceType;
  generationMode?: AIGenerationMode | null;
  automationFramework?: AutomationFramework | null;
  automationCode?: string | null;
};

export type PaginatedTestCases = {
  items: TestCase[];
  total: number;
  page: number;
  totalPages: number;
};

export type AutomationRunStatus =
  | "PASSED"
  | "FAILED"
  | "ERROR";

export type AutomationStepStatus =
  | AutomationRunStatus
  | "SKIPPED";

export type AutomationRunMode =
  | "HEADLESS"
  | "HEADED";

export type AutomationRunOptions = {
  headed?: boolean;
  slowMo?: number;
  timeoutMs?: number;
};

export type AutomationRunSummary = {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
};

export type AutomationExecutionStep = {
  order: number;
  title: string;
  status: AutomationStepStatus;

  startedAt: string | null;
  finishedAt: string | null;
  failedAt: string | null;
  durationMs: number;

  expectedResult: string | null;
  actualResult: string | null;

  error: string | null;
  screenshotUrl: string | null;
};

export type AutomationFailureDetails = {
  sourceFile: string | null;
  sourceLine: number | null;
  sourceColumn: number | null;
  sourceSnippet: string | null;

  locator: string | null;

  expectedResult: string | null;
  actualResult: string | null;

  message: string | null;

  screenshotUrl: string | null;
  traceUrl: string | null;
  artifactsZipUrl: string | null;
  executionReportUrl: string | null;
};

export type AutomationRunResult = {
  runId: string;
  testCaseId: string | null;

  status: AutomationRunStatus;
  browser: "CHROMIUM";
  mode: AutomationRunMode;

  startedAt: string;
  finishedAt: string;
  failedAt: string | null;
  durationMs: number;

  summary: AutomationRunSummary;
  steps: AutomationExecutionStep[];

  failureDetails: AutomationFailureDetails | null;

  error: string | null;

  screenshotPath: string | null;
  screenshotUrl: string | null;
  traceUrl: string | null;
  artifactsZipUrl: string | null;
  executionReportUrl: string | null;

  logs: string[];
};

type AutomationRunApiResponse = AutomationRunResult;

async function getErrorMessage(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const data: unknown = await res.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      const message = (
        data as {
          message?: unknown;
        }
      ).message;

      if (typeof message === "string") {
        return message;
      }

      if (Array.isArray(message)) {
        return message
          .filter(
            (item): item is string =>
              typeof item === "string"
          )
          .join(", ");
      }
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (
        data as {
          error?: unknown;
        }
      ).error === "string"
    ) {
      return (
        data as {
          error: string;
        }
      ).error;
    }
  } catch {
    try {
      const text = await res.text();

      if (text) {
        return text;
      }
    } catch {
      // Ignore text parsing errors.
    }
  }

  return fallback;
}

export function getAutomationAssetUrl(
  assetUrl: string | null | undefined
): string | null {
  if (!assetUrl) {
    return null;
  }

  if (
    assetUrl.startsWith("http://") ||
    assetUrl.startsWith("https://")
  ) {
    return assetUrl;
  }

  if (assetUrl.startsWith("/")) {
    return `${API_URL}${assetUrl}`;
  }

  return `${API_URL}/${assetUrl}`;
}

function normalizeAutomationRunResult(
  result: AutomationRunApiResponse
): AutomationRunResult {
  const normalizeUrl = (
    value: string | null
  ): string | null =>
    getAutomationAssetUrl(value);

  return {
    ...result,

    screenshotUrl:
      normalizeUrl(result.screenshotUrl),
    traceUrl:
      normalizeUrl(result.traceUrl),
    artifactsZipUrl:
      normalizeUrl(result.artifactsZipUrl),
    executionReportUrl:
      normalizeUrl(result.executionReportUrl),

    steps: result.steps.map((step) => ({
      ...step,
      screenshotUrl:
        normalizeUrl(step.screenshotUrl),
    })),

    failureDetails:
      result.failureDetails
        ? {
            ...result.failureDetails,
            screenshotUrl:
              normalizeUrl(
                result.failureDetails
                  .screenshotUrl
              ),
            traceUrl:
              normalizeUrl(
                result.failureDetails.traceUrl
              ),
            artifactsZipUrl:
              normalizeUrl(
                result.failureDetails
                  .artifactsZipUrl
              ),
            executionReportUrl:
              normalizeUrl(
                result.failureDetails
                  .executionReportUrl
              ),
          }
        : null,
  };
}

export async function getTestCases(
  suiteId: string,
  data: {
    status: string;
    priority: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedTestCases> {
  const res = await fetch(
    `${API_URL}/suites/${suiteId}/testcases/by-pagination`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: data.status,
        priority: data.priority,
        search: data.search || undefined,
        page: data.page ?? 1,
        limit: data.limit ?? 10,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      await getErrorMessage(
        res,
        "Erreur récupération test cases"
      )
    );
  }

  return res.json() as Promise<PaginatedTestCases>;
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
    throw new Error(
      await getErrorMessage(
        res,
        "Erreur récupération test case"
      )
    );
  }

  return res.json() as Promise<TestCase>;
}

export async function createTestCase(
  suiteId: string,
  payload: CreateTestCasePayload
): Promise<TestCase> {
  const res = await fetch(
    `${API_URL}/suites/${suiteId}/testcases`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(
      await getErrorMessage(
        res,
        "Erreur création test case"
      )
    );
  }

  return res.json() as Promise<TestCase>;
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
    throw new Error(
      await getErrorMessage(
        res,
        "Erreur modification test case"
      )
    );
  }

  return res.json() as Promise<TestCase>;
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
    throw new Error(
      await getErrorMessage(
        res,
        "Erreur suppression test case"
      )
    );
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
    throw new Error(
      await getErrorMessage(
        res,
        "Erreur duplication test case"
      )
    );
  }

  return res.json() as Promise<TestCase>;
}

export async function runTestCaseAutomation(
  suiteId: string,
  testCaseId: string,
  options: AutomationRunOptions = {}
): Promise<AutomationRunResult> {
  const res = await fetch(
    `${API_URL}/suites/${suiteId}/testcases/${testCaseId}/run-automation`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        headed: options.headed ?? false,
        slowMo: options.slowMo,
        timeoutMs: options.timeoutMs,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      await getErrorMessage(
        res,
        "Erreur lors de l’exécution Playwright"
      )
    );
  }

  const result =
    (await res.json()) as AutomationRunApiResponse;

  return normalizeAutomationRunResult(result);
}

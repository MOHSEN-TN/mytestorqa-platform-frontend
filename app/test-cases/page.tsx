/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import api from "../../app/api/axios/route";
import { useTheme } from "../../context/ThemeContext";
import { useProject } from "../../context/ProjectContext";

type TestCase = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  steps?: string;
  expected?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
};

type StepRow = {
  action: string;
  expected: string;
};

export default function TestCasesPage() {
  const { isDark } = useTheme();
  const { selectedProject } = useProject();

  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<StepRow[]>([{ action: "", expected: "" }]);
  const [status, setStatus] = useState("READY");
  const [priority, setPriority] = useState("HIGH");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSteps, setEditSteps] = useState<StepRow[]>([
    { action: "", expected: "" },
  ]);
  const [editStatus, setEditStatus] = useState("READY");
  const [editPriority, setEditPriority] = useState("HIGH");

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const colors = {
    title: isDark ? "#f8fafc" : "#1e293b",
    text: isDark ? "#e2e8f0" : "#334155",
    muted: isDark ? "#94a3b8" : "#64748b",
    cardBg: isDark ? "#1e293b" : "#ffffff",
    cardBorder: isDark ? "#334155" : "#e5e7eb",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputText: isDark ? "#f8fafc" : "#0f172a",
    inputBorder: isDark ? "#475569" : "#cbd5e1",
    primary: "#2563eb",
    danger: "#ef4444",
    secondary: isDark ? "#475569" : "#64748b",
    successText: "#15803d",
    successBg: "#dcfce7",
    errorText: "#b91c1c",
    errorBg: "#fee2e2",
    infoBg: isDark ? "#172554" : "#dbeafe",
    infoText: isDark ? "#bfdbfe" : "#1d4ed8",
    softBlockBg: isDark ? "#111827" : "#f8fafc",
  };

  async function fetchTestCases() {
    if (!selectedProject) return;

    try {
      setPageError("");
      const res = await api.get(`/projects/${selectedProject.id}/testcases`);
      setTestCases(res.data);
    } catch (error: any) {
      setPageError(
        error?.response?.data?.message || "Failed to load test cases"
      );
    }
  }

  function handleStepChange(
    index: number,
    field: "action" | "expected",
    value: string
  ) {
    const updatedSteps = [...steps];
    updatedSteps[index][field] = value;
    setSteps(updatedSteps);
  }

  function addStep() {
    setSteps([...steps, { action: "", expected: "" }]);
  }

  function removeStep(index: number) {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  }

  function handleEditStepChange(
    index: number,
    field: "action" | "expected",
    value: string
  ) {
    const updatedSteps = [...editSteps];
    updatedSteps[index][field] = value;
    setEditSteps(updatedSteps);
  }

  function addEditStep() {
    setEditSteps([...editSteps, { action: "", expected: "" }]);
  }

  function removeEditStep(index: number) {
    if (editSteps.length === 1) return;
    setEditSteps(editSteps.filter((_, i) => i !== index));
  }

  function convertTextToSteps(
    stepsText?: string,
    expectedText?: string
  ): StepRow[] {
    const actions = (stepsText || "")
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());

    const expecteds = (expectedText || "")
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());

    const maxLength = Math.max(actions.length, expecteds.length, 1);

    const rows: StepRow[] = [];

    for (let i = 0; i < maxLength; i++) {
      rows.push({
        action: actions[i] || "",
        expected: expecteds[i] || "",
      });
    }

    return rows;
  }

  function buildPayloadFromSteps(stepRows: StepRow[]) {
    const filtered = stepRows.filter(
      (step) => step.action.trim() || step.expected.trim()
    );

    return {
      steps: filtered
        .map((step, index) => `${index + 1}. ${step.action.trim()}`)
        .join("\n"),
      expected: filtered
        .map((step, index) => `${index + 1}. ${step.expected.trim()}`)
        .join("\n"),
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setPageError("");

    if (!selectedProject) {
      setPageError("Please select a project first");
      return;
    }

    if (!title.trim()) {
      setPageError("Test case title is required");
      return;
    }

    const hasAtLeastOneFilledStep = steps.some(
      (step) => step.action.trim() || step.expected.trim()
    );

    if (!hasAtLeastOneFilledStep) {
      setPageError("Please add at least one test step");
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayloadFromSteps(steps);

      await api.post(`/projects/${selectedProject.id}/testcases`, {
        title: title.trim(),
        description: description.trim(),
        steps: payload.steps,
        expected: payload.expected,
        status,
        priority,
      });

      setTitle("");
      setDescription("");
      setSteps([{ action: "", expected: "" }]);
      setStatus("READY");
      setPriority("HIGH");

      setSuccessMessage("Test case created successfully");
      await fetchTestCases();
    } catch (error: any) {
      setPageError(
        error?.response?.data?.message || "Failed to create test case"
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(testCase: TestCase) {
    setEditingId(testCase.id);
    setEditTitle(testCase.title || "");
    setEditDescription(testCase.description || "");
    setEditSteps(convertTextToSteps(testCase.steps, testCase.expected));
    setEditStatus(testCase.status || "READY");
    setEditPriority(testCase.priority || "HIGH");
    setSuccessMessage("");
    setPageError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditSteps([{ action: "", expected: "" }]);
    setEditStatus("READY");
    setEditPriority("HIGH");
  }

  async function handleUpdate(testCaseId: string) {
    if (!selectedProject) return;

    setSuccessMessage("");
    setPageError("");

    if (!editTitle.trim()) {
      setPageError("Test case title is required");
      return;
    }

    const hasAtLeastOneFilledStep = editSteps.some(
      (step) => step.action.trim() || step.expected.trim()
    );

    if (!hasAtLeastOneFilledStep) {
      setPageError("Please add at least one test step");
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayloadFromSteps(editSteps);

      await api.patch(
        `/projects/${selectedProject.id}/testcases/${testCaseId}`,
        {
          title: editTitle.trim(),
          description: editDescription.trim(),
          steps: payload.steps,
          expected: payload.expected,
          status: editStatus,
          priority: editPriority,
        }
      );

      setSuccessMessage("Test case updated successfully");
      cancelEdit();
      await fetchTestCases();
    } catch (error: any) {
      setPageError(
        error?.response?.data?.message || "Failed to update test case"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(testCaseId: string) {
    if (!selectedProject) return;

    const confirmed = window.confirm("Delete this test case?");
    if (!confirmed) return;

    setSuccessMessage("");
    setPageError("");

    try {
      await api.delete(
        `/projects/${selectedProject.id}/testcases/${testCaseId}`
      );

      if (editingId === testCaseId) {
        cancelEdit();
      }

      setSuccessMessage("Test case deleted successfully");
      await fetchTestCases();
    } catch (error: any) {
      setPageError(
        error?.response?.data?.message || "Failed to delete test case"
      );
    }
  }

  useEffect(() => {
    if (selectedProject) {
      fetchTestCases();
    } else {
      setTestCases([]);
    }
  }, [selectedProject]);

  if (!selectedProject) {
    return (
      <div style={{ width: "100%" }}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: colors.title,
            fontSize: "48px",
            fontWeight: 700,
          }}
        >
          Test Cases
        </h1>

        <div
          style={{
            maxWidth: 900,
            background: colors.infoBg,
            color: colors.infoText,
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          Please select a project first from the Projects page.
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <h1
        style={{
          marginTop: 0,
          marginBottom: 8,
          color: colors.title,
          fontSize: "48px",
          fontWeight: 700,
        }}
      >
        Test Cases
      </h1>

      <p
        style={{
          marginTop: 0,
          marginBottom: 24,
          color: colors.muted,
        }}
      >
        Active project:{" "}
        <strong style={{ color: colors.text }}>{selectedProject.name}</strong>
      </p>

      <div
        style={{
          maxWidth: 900,
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 8, color: colors.text }}>
          Create Test Case
        </h2>

        <p style={{ margin: 0, marginBottom: 20, color: colors.muted }}>
          Add a new test case for the selected project.
        </p>

        <form
          onSubmit={handleCreate}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
              color: colors.inputText,
              outline: "none",
            }}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
              color: colors.inputText,
              outline: "none",
              resize: "vertical",
            }}
          />

          <div
            style={{
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 12,
              padding: 16,
              background: colors.softBlockBg,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, color: colors.text }}>Test Steps</h3>

              <button
                type="button"
                onClick={addStep}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: colors.primary,
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                + Add Step
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {steps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: 10,
                    padding: 16,
                    background: colors.inputBg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <strong style={{ color: colors.text }}>
                      Step {index + 1}
                    </strong>

                    
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <textarea
                      placeholder="Action"
                      value={step.action}
                      onChange={(e) =>
                        handleStepChange(index, "action", e.target.value)
                      }
                      rows={3}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${colors.inputBorder}`,
                        background: colors.inputBg,
                        color: colors.inputText,
                        outline: "none",
                        resize: "vertical",
                      }}
                    />

                    <textarea
                      placeholder="Expected Result"
                      value={step.expected}
                      onChange={(e) =>
                        handleStepChange(index, "expected", e.target.value)
                      }
                      rows={3}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${colors.inputBorder}`,
                        background: colors.inputBg,
                        color: colors.inputText,
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${colors.inputBorder}`,
                background: colors.inputBg,
                color: colors.inputText,
                outline: "none",
                minWidth: 180,
              }}
            >
              <option value="READY">READY</option>
              <option value="DRAFT">DRAFT</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${colors.inputBorder}`,
                background: colors.inputBg,
                color: colors.inputText,
                outline: "none",
                minWidth: 180,
              }}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: 8,
                border: "none",
                background: colors.primary,
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "Creating..." : "Create Test Case"}
            </button>
          </div>
        </form>

        {successMessage && (
          <p
            style={{
              marginTop: 16,
              color: colors.successText,
              background: colors.successBg,
              padding: 10,
              borderRadius: 8,
            }}
          >
            {successMessage}
          </p>
        )}

        {pageError && (
          <p
            style={{
              marginTop: 16,
              color: colors.errorText,
              background: colors.errorBg,
              padding: 10,
              borderRadius: 8,
            }}
          >
            {pageError}
          </p>
        )}
      </div>

      <div style={{ maxWidth: 900 }}>
        <h2 style={{ marginBottom: 16, color: colors.text }}>
          Test Cases List
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {testCases.length > 0 ? (
            testCases.map((testCase) => {
              const isEditing = editingId === testCase.id;

              return (
                <div
                  key={testCase.id}
                  style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  {!isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: colors.text,
                          }}
                        >
                          {testCase.title}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() => startEdit(testCase)}
                            style={{
                              background: colors.primary,
                              color: "#ffffff",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(testCase.id)}
                            style={{
                              background: colors.danger,
                              color: "#ffffff",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {testCase.description && (
                        <div
                          style={{
                            fontSize: 14,
                            color: colors.muted,
                            marginBottom: 8,
                          }}
                        >
                          <strong>Description:</strong> {testCase.description}
                        </div>
                      )}

                      {testCase.steps && (
                        <div
                          style={{
                            fontSize: 14,
                            color: colors.muted,
                            marginBottom: 8,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <strong>Steps:</strong>
                          <pre
                            style={{
                              margin: "6px 0 0 0",
                              whiteSpace: "pre-wrap",
                              color: colors.muted,
                              background: "transparent",
                              fontFamily: "inherit",
                            }}
                          >
                            {testCase.steps}
                          </pre>
                        </div>
                      )}

                      {testCase.expected && (
                        <div
                          style={{
                            fontSize: 14,
                            color: colors.muted,
                            marginBottom: 8,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <strong>Expected:</strong>
                          <pre
                            style={{
                              margin: "6px 0 0 0",
                              whiteSpace: "pre-wrap",
                              color: colors.muted,
                              background: "transparent",
                              fontFamily: "inherit",
                            }}
                          >
                            {testCase.expected}
                          </pre>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          fontSize: 13,
                          color: colors.muted,
                          marginBottom: 8,
                        }}
                      >
                        <span>Status: {testCase.status}</span>
                        <span>Priority: {testCase.priority}</span>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: colors.muted,
                        }}
                      >
                        ID: {testCase.id}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: `1px solid ${colors.inputBorder}`,
                            background: colors.inputBg,
                            color: colors.inputText,
                            outline: "none",
                          }}
                        />

                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: `1px solid ${colors.inputBorder}`,
                            background: colors.inputBg,
                            color: colors.inputText,
                            outline: "none",
                            resize: "vertical",
                          }}
                        />

                        <div
                          style={{
                            border: `1px solid ${colors.cardBorder}`,
                            borderRadius: 12,
                            padding: 16,
                            background: colors.softBlockBg,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 16,
                            }}
                          >
                            <h3 style={{ margin: 0, color: colors.text }}>
                              Edit Steps
                            </h3>

                            <button
                              type="button"
                              onClick={addEditStep}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: colors.primary,
                                color: "#ffffff",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              + Add Step
                            </button>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 16,
                            }}
                          >
                            {editSteps.map((step, index) => (
                              <div
                                key={index}
                                style={{
                                  border: `1px solid ${colors.inputBorder}`,
                                  borderRadius: 10,
                                  padding: 16,
                                  background: colors.inputBg,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 12,
                                  }}
                                >
                                  <strong style={{ color: colors.text }}>
                                    Step {index + 1}
                                  </strong>

                                  <button
                                    type="button"
                                    onClick={() => removeEditStep(index)}
                                    disabled={editSteps.length === 1}
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: 8,
                                      border: "none",
                                      background: colors.danger,
                                      color: "#ffffff",
                                      cursor:
                                        editSteps.length === 1
                                          ? "not-allowed"
                                          : "pointer",
                                      fontWeight: 600,
                                      opacity: editSteps.length === 1 ? 0.6 : 1,
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                  }}
                                >
                                  <textarea
                                    placeholder="Action"
                                    value={step.action}
                                    onChange={(e) =>
                                      handleEditStepChange(
                                        index,
                                        "action",
                                        e.target.value
                                      )
                                    }
                                    rows={3}
                                    style={{
                                      padding: 12,
                                      borderRadius: 8,
                                      border: `1px solid ${colors.inputBorder}`,
                                      background: colors.inputBg,
                                      color: colors.inputText,
                                      outline: "none",
                                      resize: "vertical",
                                    }}
                                  />

                                  <textarea
                                    placeholder="Expected Result"
                                    value={step.expected}
                                    onChange={(e) =>
                                      handleEditStepChange(
                                        index,
                                        "expected",
                                        e.target.value
                                      )
                                    }
                                    rows={3}
                                    style={{
                                      padding: 12,
                                      borderRadius: 8,
                                      border: `1px solid ${colors.inputBorder}`,
                                      background: colors.inputBg,
                                      color: colors.inputText,
                                      outline: "none",
                                      resize: "vertical",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            style={{
                              padding: 12,
                              borderRadius: 8,
                              border: `1px solid ${colors.inputBorder}`,
                              background: colors.inputBg,
                              color: colors.inputText,
                              outline: "none",
                              minWidth: 180,
                            }}
                          >
                            <option value="READY">READY</option>
                            <option value="DRAFT">DRAFT</option>
                          </select>

                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                            style={{
                              padding: 12,
                              borderRadius: 8,
                              border: `1px solid ${colors.inputBorder}`,
                              background: colors.inputBg,
                              color: colors.inputText,
                              outline: "none",
                              minWidth: 180,
                            }}
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                          </select>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleUpdate(testCase.id)}
                            disabled={loading}
                            style={{
                              background: colors.primary,
                              color: "#ffffff",
                              border: "none",
                              padding: "10px 14px",
                              borderRadius: 8,
                              cursor: loading ? "not-allowed" : "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Save
                          </button>

                          <button
                            onClick={cancelEdit}
                            style={{
                              background: colors.secondary,
                              color: "#ffffff",
                              border: "none",
                              padding: "10px 14px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <div
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: 12,
                padding: 16,
                color: colors.muted,
              }}
            >
              No test cases found for this project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
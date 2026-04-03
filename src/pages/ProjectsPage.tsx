import { useEffect, useState } from "react";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { useProject } from "../context/ProjectContext";

type Project = {
  id: string;
  name: string;
  createdAt?: string;
};

export default function ProjectsPage() {
  const { isDark } = useTheme();
  const { selectedProject, setSelectedProject } = useProject();

  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const colors = {
    title: isDark ? "#f8fafc" : "#1e293b",
    text: isDark ? "#e2e8f0" : "#334155",
    muted: isDark ? "#94a3b8" : "#64748b",
    cardBg: isDark ? "#1e293b" : "#ffffff",
    cardBorder: isDark ? "#334155" : "#e5e7eb",
    selectedBorder: "#2563eb",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputText: isDark ? "#f8fafc" : "#0f172a",
    inputBorder: isDark ? "#475569" : "#cbd5e1",
    primary: "#2563eb",
    danger: "#ef4444",
    successText: "#15803d",
    successBg: "#dcfce7",
    errorText: "#b91c1c",
    errorBg: "#fee2e2",
    selectedBadgeBg: "#2563eb",
    selectedBadgeText: "#ffffff",
  };

  async function fetchProjects() {
    try {
      setPageError("");
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch {
      setPageError("Failed to load projects");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setPageError("");

    if (!name.trim()) {
      setPageError("Project name is required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/projects", {
        name: name.trim(),
      });

      const createdProject = res.data;

      setName("");
      setSuccessMessage("Project created successfully");

      if (createdProject?.id && createdProject?.name) {
        setSelectedProject({
          id: createdProject.id,
          name: createdProject.name,
        });
      }

      await fetchProjects();
    } catch (error: any) {
      setPageError(error?.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Delete this project?");
    if (!confirmDelete) return;

    setSuccessMessage("");
    setPageError("");

    try {
      await api.delete(`/projects/${id}`);

      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }

      setSuccessMessage("Project deleted successfully");
      await fetchProjects();
    } catch (error: any) {
      setPageError(error?.response?.data?.message || "Failed to delete project");
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

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
        Projects
      </h1>

      {/* CREATE PROJECT */}
      <div
        style={{
          maxWidth: 800,
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 8, color: colors.text }}>
          Create Project
        </h2>

        <p style={{ margin: 0, marginBottom: 20, color: colors.muted }}>
          Add a new project to your QA platform.
        </p>

        <form
          onSubmit={handleCreate}
          style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Enter project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flex: 1,
              minWidth: 260,
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
              color: colors.inputText,
              outline: "none",
            }}
          />

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
            {loading ? "Creating..." : "Create"}
          </button>
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

      {/* LIST PROJECTS */}
      <div style={{ maxWidth: 800 }}>
        <h2 style={{ marginBottom: 16, color: colors.text }}>
          Projects List
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${
                    selectedProject?.id === project.id
                      ? colors.selectedBorder
                      : colors.cardBorder
                  }`,
                  borderRadius: 12,
                  padding: 16,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      {project.name}
                    </div>

                    <div style={{ fontSize: 14, color: colors.muted }}>
                      ID: {project.id}
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: 8 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectedProject?.id === project.id && (
                      <span
                        style={{
                          background: colors.selectedBadgeBg,
                          color: colors.selectedBadgeText,
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Selected
                      </span>
                    )}

                    <button
                      onClick={() => handleDelete(project.id)}
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
              </div>
            ))
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
              No projects yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import api from "../../app/api/axios/route";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isDark } = useTheme();

  const colors = {
    pageTitle: isDark ? "#f8fafc" : "#1e293b",
    cardBg: isDark ? "#1e293b" : "#ffffff",
    cardBorder: isDark ? "#334155" : "#e5e7eb",
    cardShadow: isDark
      ? "0 2px 12px rgba(0,0,0,0.25)"
      : "0 2px 10px rgba(0,0,0,0.06)",
    heading: isDark ? "#f1f5f9" : "#334155",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    label: isDark ? "#e2e8f0" : "#0f172a",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputBorder: isDark ? "#475569" : "#cbd5e1",
    inputText: isDark ? "#f8fafc" : "#0f172a",
    buttonBg: loading ? (isDark ? "#3b82f6" : "#93c5fd") : "#2563eb",
    buttonText: "#ffffff",
    successText: "#15803d",
    successBg: "#dcfce7",
    errorText: "#b91c1c",
    errorBg: "#fee2e2",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await api.patch("/users/password", {
        oldPassword,
        newPassword,
      });

      setMessage(res.data.message || "Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <h1
        style={{
          marginTop: 0,
          marginBottom: 24,
          color: colors.pageTitle,
          fontSize: "48px",
          fontWeight: 700,
        }}
      >
        Settings
      </h1>

      <div
        style={{
          maxWidth: 520,
          background: colors.cardBg,
          padding: 24,
          borderRadius: 12,
          boxShadow: colors.cardShadow,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            color: colors.heading,
          }}
        >
          Change Password
        </h2>

        <p
          style={{
            color: colors.textMuted,
            marginTop: 0,
            marginBottom: 24,
          }}
        >
          Update your account password securely.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
                color: colors.label,
              }}
            >
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${colors.inputBorder}`,
                background: colors.inputBg,
                color: colors.inputText,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
                color: colors.label,
              }}
            >
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${colors.inputBorder}`,
                background: colors.inputBg,
                color: colors.inputText,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
                color: colors.label,
              }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${colors.inputBorder}`,
                background: colors.inputBg,
                color: colors.inputText,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {message && (
            <p
              style={{
                color: colors.successText,
                background: colors.successBg,
                padding: 10,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {message}
            </p>
          )}

          {error && (
            <p
              style={{
                color: colors.errorText,
                background: colors.errorBg,
                padding: 10,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: colors.buttonBg,
              color: colors.buttonText,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
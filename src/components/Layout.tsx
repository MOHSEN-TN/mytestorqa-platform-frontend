import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { removeToken } from "../utils/storage";
import { useTheme } from "../context/ThemeContext";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

 function logout() {
  removeToken();
  navigate("/Login", { replace: true });
}

  const isActive = (path: string) => location.pathname === path;

  const colors = {
    appBg: isDark ? "#0f172a" : "#f8fafc",
    sidebarBg: isDark ? "#1e293b" : "#ffffff",
    contentBg: isDark ? "#0b1324" : "#f8fafc",
    text: isDark ? "#e2e8f0" : "#1f2937",
    title: isDark ? "#ffffff" : "#1e293b",
    border: isDark ? "#334155" : "#e5e7eb",
    activeBg: isDark ? "#2563eb" : "#dbeafe",
    activeText: isDark ? "#ffffff" : "#1d4ed8",
    toggleBg: isDark ? "#334155" : "#e2e8f0",
    logoutBg: "#ef4444",
    logoutText: "#ffffff",
  };

  const linkStyle = (active: boolean): React.CSSProperties => ({
    padding: "12px 12px",
    borderRadius: "10px",
    textDecoration: "none",
    color: active ? colors.activeText : colors.text,
    backgroundColor: active ? colors.activeBg : "transparent",
    fontWeight: 500,
    display: "block",
  });

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        background: colors.appBg,
        color: colors.text,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <aside
        style={{
          width: 250,
          minHeight: "100vh",
          background: colors.sidebarBg,
          borderRight: `1px solid ${colors.border}`,
          padding: 20,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: colors.title,
            fontSize: "24px",
            fontWeight: 700,
          }}
        >
          MyTestorQA
        </h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Link to="/dashboard" style={linkStyle(isActive("/dashboard"))}>
            Dashboard
          </Link>

          <Link to="/projects" style={linkStyle(isActive("/projects"))}>
            Projects
          </Link>

          <Link to="/testcases" style={linkStyle(isActive("/testcases"))}>
            Test Cases
          </Link>

          <Link to="/suites" style={linkStyle(isActive("/suites"))}>
            Suites
          </Link>

          <Link to="/runs" style={linkStyle(isActive("/runs"))}>
            Runs
          </Link>

          <Link to="/settings" style={linkStyle(isActive("/settings"))}>
            Settings
          </Link>
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: colors.toggleBg,
              color: colors.text,
              cursor: "pointer",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: colors.logoutBg,
              color: colors.logoutText,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          width: "100%",
          background: colors.contentBg,
          color: colors.text,
          padding: 32,
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { setToken } from "../utils/storage";

export default function LoginPage() {

  const [email, setEmail] = useState("aissaouimohsen@gmail.com");
  const [password, setPassword] = useState("Admin12345!");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {

      const data = await login(email, password);

      setToken(data.access_token);

      navigate("/dashboard");

    } catch (err) {
      setError("Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h1>MyTestorQAPlatform</h1>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>

        <div>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>

        <div>
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Sign in</button>

      </form>
    </div>
  );
}
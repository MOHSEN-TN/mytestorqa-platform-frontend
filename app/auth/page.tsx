"use client";

import { useState } from "react";
import { login } from "../../app/api/auth/route";
import { setToken } from "../../utils/storage";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const [email, setEmail] = useState("aissaouimohsen@gmail.com");
  const [password, setPassword] = useState("Admin12345!");
  const [error, setError] = useState("");
  const router = useRouter()
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await login(email, password);
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError("Login failed");
    }
  }

  return (
    <div className="w-max-[400px] m-20">
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
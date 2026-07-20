import { useState } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const res = await fetch(`${SERVER_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });
    const data = await res.json();

    if (data.ok) {
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("token", data.token);
      window.location.href = data.role === "admin" ? "/admin" : "/dashboard";
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-wrap">
      <div className="card">
        <img src="/company-logo.png" alt="Company Logo" className="logo" />
        <h2>Company Login</h2>
        <input placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button onClick={submit}>Login</button>
      </div>
    </div>
  );
}

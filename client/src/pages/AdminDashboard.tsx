import { useEffect, useState } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

type User = {
  id: number;
  userId: string;
  role: string;
  status: string;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const load = async () => {
    const res = await fetch(`${SERVER_URL}/api/users`);
    setUsers(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const addUser = async () => {
    await fetch(`${SERVER_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password, role: "user" }),
    });
    setUserId("");
    setPassword("");
    load();
  };

  const removeUser = async (id: number) => {
    await fetch(`${SERVER_URL}/api/users/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="page">
      <h2>Admin Panel</h2>
      <div className="row">
        <input placeholder="New user ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={addUser}>Add User</button>
      </div>

      <h3>Users</h3>
      <ul>
        {users.map(u => (
          <li key={u.id}>
            {u.userId} ({u.role}) - {u.status}
            <button onClick={() => removeUser(u.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

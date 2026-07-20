import { useEffect, useState } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

type User = {
  id: number;
  userId: string;
  status: string;
};

export default function UserDashboard() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/users`).then(r => r.json()).then(setUsers);
  }, []);

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <p>Online coworkers</p>
      <ul>
        {users.map(u => (
          <li key={u.id}>
            {u.userId} - {u.status}
            <button onClick={() => (window.location.href = `/room/${u.id}`)}>Chat</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

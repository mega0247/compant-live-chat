const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let users = [
  { id: 1, userId: "admin1", passwordHash: bcrypt.hashSync("1234", 10), role: "admin", status: "active" },
  { id: 2, userId: "user1", passwordHash: bcrypt.hashSync("1234", 10), role: "user", status: "active" }
];

app.post("/api/login", async (req, res) => {
  const { userId, password } = req.body;
  const user = users.find(u => u.userId === userId);
  if (!user) return res.json({ ok: false });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.json({ ok: false });
  res.json({ ok: true, role: user.role, userId: user.userId, token: "demo-token" });
});

app.get("/api/users", (req, res) => {
  res.json(users.map(({ passwordHash, ...u }) => u));
});

app.post("/api/users", async (req, res) => {
  const { userId, password, role } = req.body;
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  users.push({
    id,
    userId,
    passwordHash: await bcrypt.hash(password, 10),
    role: role || "user",
    status: "active"
  });
  res.json({ ok: true });
});

app.delete("/api/users/:id", (req, res) => {
  users = users.filter(u => u.id !== Number(req.params.id));
  res.json({ ok: true });
});

let rooms = {};

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId] = rooms[roomId].filter(u => u.socketId !== socket.id);
    rooms[roomId].push({ socketId: socket.id, userId });
    io.to(roomId).emit("room-users", rooms[roomId]);
    io.to(roomId).emit("system-message", `${userId} joined the room`);
  });

  socket.on("chat-message", ({ roomId, userId, message }) => {
    io.to(roomId).emit("chat-message", { userId, message, time: Date.now() });
  });

  socket.on("signal", ({ roomId, data }) => {
    socket.to(roomId).emit("signal", data);
  });

  socket.on("disconnect", () => {
    Object.keys(rooms).forEach((roomId) => {
      rooms[roomId] = rooms[roomId].filter(u => u.socketId !== socket.id);
      io.to(roomId).emit("room-users", rooms[roomId]);
    });
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("Server running");
});

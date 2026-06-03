const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static file dari folder utama
app.use(express.static(__dirname));

app.use(express.json());

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login-daftar.html"));
});

// Database langsung di folder utama
const ROOM_DB = "./room.json";

if (!fs.existsSync(ROOM_DB)) {
  fs.writeFileSync(ROOM_DB, "[]");
}

// Ambil room
app.get("/rooms", (req, res) => {
  const data = JSON.parse(fs.readFileSync(ROOM_DB));
  res.json(data);
});

// Buat room
app.post("/create-room", (req, res) => {
  const { name, type, maxPlayers, owner } = req.body;

  const rooms = JSON.parse(fs.readFileSync(ROOM_DB));

  const room = {
    roomId: "ROOM" + Date.now(),
    name,
    type,
    owner,
    maxPlayers,
    players: [owner]
  };

  rooms.push(room);

  fs.writeFileSync(ROOM_DB, JSON.stringify(rooms, null, 2));

  res.json(room);

  io.emit("room-update");
});

// Socket
io.on("connection", (socket) => {
  console.log("User Connected");

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    io.to(roomId).emit("player-joined", username);
  });

  socket.on("chat-message", (data) => {
    io.emit("chat-message", data);
  });
});

// Run server
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Skypee Games Running on ${PORT}`);
});

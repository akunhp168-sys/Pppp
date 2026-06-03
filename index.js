const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login-daftar.html"));
});

const ROOM_DB = "./database/room.json";

if (!fs.existsSync(ROOM_DB)) {
  fs.writeFileSync(ROOM_DB, "[]");
}

app.get("/rooms", (req, res) => {
  const data = JSON.parse(fs.readFileSync(ROOM_DB));
  res.json(data);
});

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

server.listen(3000, () => {
  console.log("Skypee Games Running");
});
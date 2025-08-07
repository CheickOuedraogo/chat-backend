import express from "express";
import routes from "./routes/routes.js";
import CookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors"

const app = express();
const PORT = process.env.PORT || 5050;

//middleware
app.use(express.json());
app.use(cors())
app.use(CookieParser(process.env.COOKIE));

// Middleware d'audit simple
app.use((req, res, next) => {
  res.on('finish', () => {
    if (["/api/user/connexion", "/api/user", "/api/chat", "/api/chat/", "/api/room", "/api/room/"].some(p => req.path.startsWith(p))) {
      const user = req.id || req.body.email || req.body.username || 'anonyme';
      console.log(`[AUDIT] ${new Date().toISOString()} | ${req.method} ${req.path} | user: ${user} | status: ${res.statusCode}`);
    }
  });
  next();
});

//routes
app.use("/api", routes);

//middleware erreur
app.use((req, res, next) => {
  res.status(404).json({
    error: "cette route n'existe pas",
  });
});

// Ajout d'une référence à io pour l'utiliser dans les routes
export let ioInstance = null;

// Création du serveur HTTP et Socket.io
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
ioInstance = io;

// Authentification simple par token pour le socket
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers["authorization"]?.split(" ")[1];
  if (!token) return next(new Error("Token manquant"));
  try {
    const decoded = jwt.verify(token, process.env.JWT);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Token invalide"));
  }
});

io.on("connection", (socket) => {
  // Joindre l'utilisateur à ses rooms (par id utilisateur)
  socket.join(`user_${socket.user.id}`);

  // Joindre à une room de chat spécifique
  socket.on("join_room", (roomId) => {
    socket.join(`room_${roomId}`);
  });

  // Réception d'un message et broadcast dans la room
  socket.on("send_message", (data) => {
    // data: { roomId, message, sender, ... }
    io.to(`room_${data.roomId}`).emit("receive_message", data);
  });

  // Accusé de réception (état du message)
  socket.on("message_state", (data) => {
    // data: { messageId, state }
    io.to(`room_${data.roomId}`).emit("message_state_update", data);
  });
});

if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log("app listening on http://localhost:" + PORT);
  });
}

export default app;

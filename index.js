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

// Documentation API sur '/'
app.get('/', (req, res) => {
  res.type('html').send(`
    <h1>Bienvenue sur l'API Chat Backend</h1>
    <p>Voici les principaux endpoints :</p>
    <ul>
      <li><b>POST /api/user</b> : inscription (username, email, password)</li>
      <li><b>POST /api/user/connexion</b> : connexion (email, password)</li>
      <li><b>GET /api/user</b> : liste/recherche utilisateurs</li>
      <li><b>GET /api/user/id/:id</b> : infos utilisateur</li>
      <li><b>POST /api/room</b> : créer une room</li>
      <li><b>GET /api/room</b> : liste rooms</li>
      <li><b>DELETE /api/room/:id</b> : supprimer/quitter une room</li>
      <li><b>GET /api/chat/:id</b> : messages d'une room (pagination)</li>
      <li><b>GET /api/chat/:id/search</b> : recherche de messages</li>
      <li><b>POST /api/chat</b> : envoyer un message</li>
      <li><b>PUT /api/chat/:id</b> : modifier un message</li>
      <li><b>PATCH /api/chat/:id/state</b> : accusé de réception</li>
      <li><b>DELETE /api/chat/:id</b> : supprimer un message</li>
    </ul>
    <p>Pour plus de détails, consultez le <a href="https://github.com/CheickOuedraogo/chat-backend#readme" target="_blank">README</a> ou le fichier <code>README.integration.md</code> du projet.</p>
    <p>WebSocket (socket.io) disponible sur <b>/</b> (voir README pour les événements).</p>
  `);
});

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

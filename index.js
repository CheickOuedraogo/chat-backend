import express from "express";
import routes from "./routes/routes.js";
import CookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5050;

//middleware
app.use(express.json());
app.use(CookieParser(process.env.COOKIE));
app.use(cors());

// Documentation API sur '/'
app.get('/', (req, res) => {
  res.type('html').send(`
    <h1>Bienvenue sur l'API Chat Backend</h1>
    <p>Voici les principaux endpoints :</p>
    <ul>
      <li><b>POST /api/user</b> : inscription (username, nom, prenom, email, password)</li>
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
    <p><b>Note :</b> WebSocket (socket.io) n'est pas disponible sur Vercel. Utilisez les requêtes API pour les messages.</p>
    <p>Pour plus de détails, consultez le <a href="https://github.com/CheickOuedraogo/chat-backend#readme" target="_blank">README</a>.</p>
  `);
});

//routes
app.use("/api", routes);

//middleware erreur
app.use((req, res, next) => {
  res.status(404).json({
    error: "cette route n'existe pas",
  });
});

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

// Pour Vercel : export de l'app
export default app;

// Pour développement local
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("app listening on http://localhost:" + PORT);
  });
}

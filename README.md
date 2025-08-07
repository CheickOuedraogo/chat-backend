# Chat Backend

Ce projet est un backend Node.js/Express pour un système de chat interne avec gestion des utilisateurs, rooms, messages, authentification JWT, stockage PostgreSQL et chat en temps réel avec socket.io.

## Prérequis
- Node.js >= 16
- PostgreSQL

## Installation
1. **Cloner le dépôt**
   ```bash
   git clone <repo-url>
   cd chat-backend
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Configurer les variables d'environnement**
   Créez un fichier `.env` à la racine avec :
   ```env
   DB_URL=postgres://user:password@localhost:5432/nom_de_la_db
   JWT=une_clé_secrète
   COOKIE=une_autre_clé_secrète
   NODE_ENV=development
   PORT=5050
   ```

4. **Lancer le serveur**
   - En développement :
     ```bash
     npm run dev
     ```
   - En production :
     ```bash
     npm start
     ```

## Fonctionnalités principales
- Authentification JWT (cookie sécurisé)
- Création et connexion utilisateur
- Création de rooms (salons privés entre 2 utilisateurs)
- Envoi, modification, récupération de messages
- Accusés de réception (état du message : envoyé, reçu, lu)
- Sécurité renforcée sur toutes les routes
- **Chat en temps réel avec socket.io**

## Structure des routes principales

### Authentification & Utilisateurs
- `POST /api/user` : inscription (username, email, password)
- `POST /api/user/connexion` : connexion (email, password)
- `GET /api/user/` : liste des utilisateurs
- `GET /api/user/id/:id` : infos d'un utilisateur

### Rooms
- `GET /api/room/` : liste des rooms de l'utilisateur connecté
- `POST /api/room/` : créer une room avec un autre utilisateur (`participant`)

### Chat / Messages
- `GET /api/chat/:id` : messages d'une room (id = id de la room)
- `POST /api/chat/` : envoyer un message (`roomId`, `message`)
- `PUT /api/chat/:id` : modifier un message (id = id du message)
- `PATCH /api/chat/:id/state` : changer l'état d'un message (`state` = ok, recu, lu)

## Chat en temps réel (socket.io)

Le backend expose un serveur WebSocket via socket.io pour permettre l'échange de messages instantanés.

### Connexion côté client (exemple avec JavaScript)

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:5050", {
  auth: {
    token: "VOTRE_TOKEN_JWT"
  }
});

// Rejoindre une room de chat (par exemple roomId = 1)
socket.emit("join_room", 1);

// Envoyer un message dans la room
socket.emit("send_message", {
  roomId: 1,
  message: "Hello!",
  sender: 123 // id utilisateur (optionnel, le backend peut le vérifier)
});

// Recevoir les messages instantanément	socket.on("receive_message", (data) => {
  console.log("Nouveau message:", data);
});

// Mettre à jour l'état d'un message (ex: lu)
socket.emit("message_state", {
  roomId: 1,
  messageId: 42,
  state: "lu"
});

// Recevoir les mises à jour d'état	socket.on("message_state_update", (data) => {
  console.log("État du message mis à jour:", data);
});
```

### Points importants
- Le token JWT est obligatoire pour se connecter au WebSocket.
- Il faut rejoindre explicitement une room pour recevoir les messages de cette room.
- Les événements principaux sont :
  - `join_room` (rejoindre une room)
  - `send_message` (envoyer un message)
  - `receive_message` (recevoir un message)
  - `message_state` (changer l'état d'un message)
  - `message_state_update` (recevoir la mise à jour d'état)

## Notes
- Toutes les routes sensibles nécessitent un token JWT valide (envoyé via cookie ou header Authorization).
- Le backend initialise automatiquement les tables si elles n'existent pas.

## Améliorations possibles
- Pagination des messages
- Suppression de messages
- Recherche d'utilisateurs/messages

---

Pour toute question ou contribution, ouvrez une issue ou une pull request !

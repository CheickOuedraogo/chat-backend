# Chat Backend

Ce projet est un backend Node.js/Express pour un système de chat interne avec gestion des utilisateurs, rooms, messages, authentification JWT, et stockage PostgreSQL.

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

## Notes
- Toutes les routes sensibles nécessitent un token JWT valide (envoyé via cookie ou header Authorization).
- Le backend initialise automatiquement les tables si elles n'existent pas.

## Améliorations possibles
- Ajout du temps réel (WebSocket)
- Pagination des messages
- Suppression de messages
- Recherche d'utilisateurs/messages

---

Pour toute question ou contribution, ouvrez une issue ou une pull request !

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
   NODE_ENV=production
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
- Envoi, modification, suppression, récupération de messages
- Accusés de réception (état du message : envoyé, reçu, lu)
- Recherche et pagination
- Sécurité renforcée sur toutes les routes
- Chat en temps réel avec socket.io
- Audit/logs d’actions sensibles

## Déploiement

- **CORS** : activé par défaut (`app.use(cors())`), à configurer selon ton domaine en production.
- **Variables d'environnement** : utilise `.env` pour toutes les infos sensibles (voir plus haut).
- **HTTPS** : pour la production, il est recommandé d'utiliser un proxy (Nginx, Caddy, etc.) pour gérer le HTTPS.
- **Build du front-end** :
  1. Va dans `front-end` et lance `npm run build` (pour React/Vite)
  2. Servez le dossier `dist` avec un serveur statique (Nginx, serve, etc.)
- **Sécurité** :
  - Change bien les clés secrètes JWT/COOKIE en prod
  - Utilise un mot de passe fort pour la base de données
  - Active les logs d’audit pour surveiller les actions

## Documentation API

### Utilisateurs

| Méthode | Endpoint                  | Paramètres attendus                                 | Description                       |
|---------|---------------------------|-----------------------------------------------------|-----------------------------------|
| POST    | /api/user                 | body: { username, nom, prenom, email, password }    | Inscription                       |
| POST    | /api/user/connexion       | body: { email, password }                           | Connexion                         |
| GET     | /api/user                 | query: search (optionnel)                           | Liste/recherche utilisateurs      |
| GET     | /api/user/id/:id          | path: id                                            | Infos utilisateur                 |

### Rooms

| Méthode | Endpoint                  | Paramètres attendus                | Description                       |
|---------|---------------------------|------------------------------------|-----------------------------------|
| POST    | /api/room                 | body: { participant }              | Créer une room                    |
| GET     | /api/room                 |                                    | Liste rooms                       |
| DELETE  | /api/room/:id             | path: id                           | Supprimer/quitter une room        |

### Chat / Messages

| Méthode | Endpoint                  | Paramètres attendus                | Description                       |
|---------|---------------------------|------------------------------------|-----------------------------------|
| GET     | /api/chat/:id             | path: id, query: page, limit       | Messages d'une room (pagination)  |
| GET     | /api/chat/:id/search      | path: id, query: q                 | Recherche de messages             |
| POST    | /api/chat                 | body: { roomId, message }          | Envoyer un message                |
| PUT     | /api/chat/:id             | path: id, body: { message }        | Modifier un message               |
| PATCH   | /api/chat/:id/state       | path: id, body: { state }          | Accusé de réception               |
| DELETE  | /api/chat/:id             | path: id                           | Supprimer un message              |

### WebSocket (socket.io)

- Connexion : auth: { token } (JWT obligatoire)
- Événements :
  - `join_room` : { roomId }
  - `send_message` : { roomId, message, sender }
  - `receive_message` : { ...message }
  - `message_state` : { roomId, messageId, state }
  - `message_state_update` : { messageId, state }
  - `new_message_notification` : { roomId, from, message, date }

## Liens utiles
- [Express](https://expressjs.com/)
- [Socket.io](https://socket.io/)
- [Vite](https://vitejs.dev/)
- [Swagger](https://swagger.io/)

---

Pour toute question ou contribution, ouvrez une issue ou une pull request !

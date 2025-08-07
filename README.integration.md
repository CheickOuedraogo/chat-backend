# Guide d'intégration du Chat Backend

Ce guide explique comment intégrer le backend de chat dans une application front-end (web, mobile, etc.), avec exemples de code et gestion des erreurs.

---

## 1. Authentification (JWT)

- **Inscription** : POST `/api/user` (voir README principal pour les paramètres)
- **Connexion** : POST `/api/user/connexion`
- **Token JWT** : Récupéré dans la réponse, à stocker côté client (localStorage, cookie, etc.)
- **Utilisation** : À envoyer dans le header `Authorization: Bearer <token>` pour toutes les requêtes protégées.

**Exemple axios :**
```js
const res = await axios.post('http://localhost:5050/api/user/connexion', { email, password });
const token = res.data.token;
// Pour les requêtes suivantes :
axios.get('http://localhost:5050/api/room', { headers: { Authorization: `Bearer ${token}` } });
```

---

## 2. Utilisation de l’API REST

- Voir le tableau des routes et paramètres dans le README principal.
- Toujours envoyer le token JWT pour les routes protégées.

**Exemple création de room :**
```js
await axios.post('http://localhost:5050/api/room', { participant: 2 }, { headers: { Authorization: `Bearer ${token}` } });
```

---

## 3. Intégration WebSocket (temps réel)

- Utiliser `socket.io-client` côté front.
- Se connecter avec le token JWT :

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5050', { auth: { token } });
```

- Rejoindre une room :
```js
socket.emit('join_room', roomId);
```
- Envoyer un message :
```js
socket.emit('send_message', { roomId, message, sender });
```
- Recevoir un message :
```js
socket.on('receive_message', (data) => { /* ... */ });
```
- Recevoir une notification :
```js
socket.on('new_message_notification', (data) => { /* ... */ });
```

---

## 4. Statuts d’erreur et gestion

| Code | Signification                                 | Quand ?                                 |
|------|-----------------------------------------------|-----------------------------------------|
| 200  | OK                                            | Succès (GET, PUT, PATCH)                |
| 201  | Créé                                          | Création réussie (POST)                 |
| 204  | Pas de contenu                               | Suppression réussie (DELETE)            |
| 400  | Mauvaise requête (Bad Request)                | Paramètre manquant, format invalide     |
| 401  | Non autorisé (Unauthorized)                   | Token manquant ou invalide              |
| 403  | Interdit (Forbidden)                          | Accès refusé (pas le droit)             |
| 404  | Non trouvé (Not Found)                        | Ressource inexistante                   |
| 409  | Conflit                                      | Ressource déjà existante (ex: room)     |
| 500  | Erreur serveur                               | Problème interne                        |

**Exemple de gestion d’erreur axios :**
```js
try {
  await axios.get(...);
} catch (err) {
  if (err.response) {
    alert(err.response.data.error || 'Erreur inconnue');
  }
}
```

---

## 5. Conseils d’intégration
- Toujours vérifier le code de retour HTTP.
- Afficher les messages d’erreur du backend à l’utilisateur.
- Gérer la reconnexion automatique côté socket.io si besoin.
- Tester avec plusieurs utilisateurs pour valider le temps réel.

---

Pour toute question, se référer au README principal ou ouvrir une issue !

# Guide d'intégration du Chat Backend

Ce guide explique comment intégrer le backend de chat dans une application front-end (web, mobile, etc.), avec exemples de code et gestion des erreurs.

---

## 1. Configuration de la base de données

### Connection String PostgreSQL
Pour votre base de données PostgreSQL locale, utilisez cette format :

```bash
DB_URL='postgresql://postgres:1234@localhost:5432/chat'
```

**Explication du format :**
- `postgresql://` : protocole
- `postgres` : nom d'utilisateur
- `1234` : mot de passe
- `localhost` : adresse du serveur
- `5432` : port (par défaut pour PostgreSQL)
- `chat` : nom de la base de données

### Variables d'environnement requises
Créez un fichier `.env` à la racine du projet :

```bash
DB_URL='postgresql://postgres:1234@localhost:5432/chat'
JWT='votre_secret_jwt_tres_securise'
COOKIE='votre_secret_cookie_tres_securise'
PORT=5050
```

---

## 2. Migration vers l'authentification par numéro de téléphone

### Changements effectués

#### Structure de la base de données
- Ajout du champ `phone_number` (varchar(20), UNIQUE, NOT NULL) dans la table `users`
- Le champ `email` est maintenant optionnel (peut être NULL)

#### Authentification
- **Inscription** : Utilise maintenant `phone_number` (obligatoire) et `email` (optionnel)
- **Connexion** : Utilise `phone_number` et `password` au lieu d'email

#### Validation du numéro de téléphone
- Format requis : `+[indicatif pays][numéro]`
- Exemples valides : `+33123456789`, `+1234567890`, `+442071234567`
- Regex utilisée : `/^\+[1-9]\d{1,14}$/`

### Migration de la base de données

#### Pour les nouvelles installations
La base de données sera automatiquement créée avec la nouvelle structure.

#### Pour les installations existantes
Exécutez le script de migration :

```bash
node run-migration.js
```

Ce script va :
1. Ajouter la colonne `phone_number` si elle n'existe pas
2. Rendre la colonne `email` optionnelle
3. Ajouter la contrainte unique sur `phone_number`

---

## 3. Authentification (JWT)

### Inscription
```http
POST /api/user
Content-Type: application/json

{
  "username": "john_doe",
  "nom": "Doe",
  "prenom": "John",
  "phone_number": "+33123456789",
  "password": "motdepasse123",
  "email": "john@example.com"  // optionnel
}
```

### Connexion
```http
POST /api/user/connexion
Content-Type: application/json

{
  "phone_number": "+33123456789",
  "password": "motdepasse123"
}
```

**Exemple axios :**
```js
const res = await axios.post('http://localhost:5050/api/user/connexion', { 
  phone_number: '+33123456789', 
  password: 'motdepasse123' 
});
const token = res.data.token;
// Pour les requêtes suivantes :
axios.get('http://localhost:5050/api/room', { headers: { Authorization: `Bearer ${token}` } });
```

- **Token JWT** : Récupéré dans la réponse, à stocker côté client (localStorage, cookie, etc.)
- **Utilisation** : À envoyer dans le header `Authorization: Bearer <token>` pour toutes les requêtes protégées.

---

## 4. Utilisation de l'API REST

- Voir le tableau des routes et paramètres dans le README principal.
- Toujours envoyer le token JWT pour les routes protégées.

**Exemple création de room :**
```js
await axios.post('http://localhost:5050/api/room', { participant: 2 }, { headers: { Authorization: `Bearer ${token}` } });
```

---

## 5. Intégration WebSocket (temps réel)

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

## 6. Messages d'erreur mis à jour

- `"Numéro de téléphone invalide. Format requis: +[indicatif pays][numéro] (ex: +33123456789)"`
- `"Ce numéro de téléphone est déjà utilisé."`
- `"Numéro de téléphone ou mot de passe incorrect"`

---

## 7. Statuts d'erreur et gestion

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

**Exemple de gestion d'erreur axios :**
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

## 8. Compatibilité

Les utilisateurs existants devront :
1. Ajouter leur numéro de téléphone lors de leur prochaine connexion
2. Ou créer un nouveau compte avec leur numéro de téléphone

---

## 9. Sécurité

- Le numéro de téléphone est unique dans la base de données
- Validation stricte du format international
- Support des indicatifs de pays de 1 à 3 chiffres
- Longueur totale du numéro limitée à 15 chiffres (standard international)

---

## 10. Conseils d'intégration
- Toujours vérifier le code de retour HTTP.
- Afficher les messages d'erreur du backend à l'utilisateur.
- Gérer la reconnexion automatique côté socket.io si besoin.
- Tester avec plusieurs utilisateurs pour valider le temps réel.
- Utiliser le format international pour les numéros de téléphone.

---

Pour toute question, se référer au README principal ou ouvrir une issue !

import { Router } from "express";
import sql from "../db/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "./auth/auth.js";

const router = Router();

// Récupérer tous les utilisateurs (à restreindre en prod)
router.get("/", async (req, res) => {
  try {
    const response = await sql`SELECT id, username, email FROM users`;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs.", details: error.message });
  }
});

// Récupérer un utilisateur par ID
router.get("/id/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "ID utilisateur invalide." });
  }
  try {
    const response = await sql`SELECT id, username, email FROM users WHERE id = ${userId}`;
    if (response.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }
    res.status(200).json({ response: response[0] });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur.", details: error.message });
  }
});

// Inscription
router.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email et password sont requis." });
  }
  const salt = 12;
  const hash = await bcrypt.hash(password, salt);
  try {
    const response = await sql`INSERT INTO users (username, email, password) VALUES (${username},${email},${hash}) RETURNING id, username`;
    const toSign = { id: response[0].id, username: response[0].username };
    const token = generateToken(toSign);
    res.cookie("token", token, { signed: true, httpOnly: true });
    res.status(201).json({ id: response[0].id, token });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'inscription.", details: error.message });
  }
});

// Connexion
router.post("/connexion", async (req, res) => {
  const { email, password = "" } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email et password sont requis." });
  }
  try {
    const response = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (response.length === 0) {
      return res.status(401).json({ error: "mail ou mot de passe incorrect" });
    }
    const isTrue = await bcrypt.compare(password, response[0].password);
    if (!isTrue)
      return res.status(401).json({ error: "mail ou mot de passe incorrect" });
    const toSign = { id: response[0].id, username: response[0].username };
    const token = generateToken(toSign);
    res.cookie("token", token, { signed: true, httpOnly: true });
    return res.status(200).json({ id: response[0].id, token });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la connexion.", details: error.message });
  }
});

export default router;

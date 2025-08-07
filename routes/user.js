import { Router } from "express";
import sql from "../db/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "./auth/auth.js";

const router = Router();

// Récupérer tous les utilisateurs (à restreindre en prod)
router.get("/", async (req, res) => {
  const search = req.query.search || "";
  try {
    let response;
    if (search) {
      response = await sql`SELECT id, username, nom, prenom, email FROM users WHERE username ILIKE ${'%' + search + '%'} OR nom ILIKE ${'%' + search + '%'} OR prenom ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'} `;
    } else {
      response = await sql`SELECT id, username, nom, prenom, email FROM users`;
    }
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
    const response = await sql`SELECT id, username, nom, prenom, email FROM users WHERE id = ${userId}`;
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
  const { username, nom, prenom, email, password } = req.body;
  // Validation avancée
  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    return res.status(400).json({ error: "username requis (au moins 2 caractères)." });
  }
  if (!nom || typeof nom !== 'string' || nom.trim().length < 2) {
    return res.status(400).json({ error: "nom requis (au moins 2 caractères)." });
  }
  if (!prenom || typeof prenom !== 'string' || prenom.trim().length < 2) {
    return res.status(400).json({ error: "prenom requis (au moins 2 caractères)." });
  }
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "email invalide." });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: "password requis (8 caractères minimum)." });
  }
  const salt = 12;
  const hash = await bcrypt.hash(password, salt);
  try {
    // Vérifier unicité de l'email avant insertion
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "Cet email est déjà utilisé." });
    }
    const response = await sql`INSERT INTO users (username, nom, prenom, email, password) VALUES (${username},${nom},${prenom},${email},${hash}) RETURNING id, username, nom, prenom`;
    const toSign = { id: response[0].id, username: response[0].username };
    const token = generateToken(toSign);
    res.cookie("token", token, { signed: true, httpOnly: true });
    res.status(201).json({ id: response[0].id, token, nom: response[0].nom, prenom: response[0].prenom });
  } catch (error) {
    // Gestion d'erreur pour violation de contrainte unique
    if (error.code === '23505' && error.detail && error.detail.includes('email')) {
      return res.status(409).json({ error: "Cet email est déjà utilisé." });
    }
    res.status(500).json({ error: "Erreur lors de l'inscription.", details: error.message });
  }
});

// Connexion
router.post("/connexion", async (req, res) => {
  const { email, password = "" } = req.body;
  // Validation avancée
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "email invalide." });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: "password requis (8 caractères minimum)." });
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

import { Router } from "express";
import sql from "../db/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "./auth/auth.js";

const router = Router();

// Fonction de validation du numéro de téléphone
const validatePhoneNumber = (phoneNumber) => {
  // Format: +[indicatif pays][numéro] (ex: +33123456789)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

// Récupérer tous les utilisateurs (à restreindre en prod)
router.get("/", async (req, res) => {
  const search = req.query.search || "";
  try {
    let response;
    if (search) {
      response = await sql`SELECT id, username, nom, prenom, email, phone_number FROM users WHERE username ILIKE ${'%' + search + '%'} OR nom ILIKE ${'%' + search + '%'} OR prenom ILIKE ${'%' + search + '%'} OR phone_number ILIKE ${'%' + search + '%'} `;
    } else {
      response = await sql`SELECT id, username, nom, prenom, email, phone_number FROM users`;
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
    const response = await sql`SELECT id, username, nom, prenom, email, phone_number FROM users WHERE id = ${userId}`;
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
  const { username, nom, prenom, email, phone_number, password } = req.body;
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
  
  // Validation du numéro de téléphone
  if (!phone_number || !validatePhoneNumber(phone_number)) {
    return res.status(400).json({ error: "Numéro de téléphone invalide. Format requis: +[indicatif pays][numéro] (ex: +33123456789)" });
  }
  
  // Validation optionnelle de l'email
  if (email) {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "email invalide." });
    }
  }
  
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: "password requis (8 caractères minimum)." });
  }
  
  const salt = 12;
  const hash = await bcrypt.hash(password, salt);
  try {
    // Vérifier unicité du numéro de téléphone avant insertion
    const existing = await sql`SELECT id FROM users WHERE phone_number = ${phone_number}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "Ce numéro de téléphone est déjà utilisé." });
    }
    
    // Vérifier unicité de l'email si fourni
    if (email) {
      const existingEmail = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingEmail.length > 0) {
        return res.status(409).json({ error: "Cet email est déjà utilisé." });
      }
    }
    
    const response = await sql`INSERT INTO users (username, nom, prenom, email, phone_number, password) VALUES (${username},${nom},${prenom},${email},${phone_number},${hash}) RETURNING id, username, nom, prenom, phone_number`;
    const toSign = { id: response[0].id, username: response[0].username };
    const token = generateToken(toSign);
    res.cookie("token", token, { signed: true, httpOnly: true });
    res.status(201).json({ id: response[0].id, token, nom: response[0].nom, prenom: response[0].prenom, phone_number: response[0].phone_number });
  } catch (error) {
    // Gestion d'erreur pour violation de contrainte unique
    if (error.code === '23505') {
      if (error.detail && error.detail.includes('phone_number')) {
        return res.status(409).json({ error: "Ce numéro de téléphone est déjà utilisé." });
      }
      if (error.detail && error.detail.includes('email')) {
        return res.status(409).json({ error: "Cet email est déjà utilisé." });
      }
    }
    res.status(500).json({ error: "Erreur lors de l'inscription.", details: error.message });
  }
});

// Connexion
router.post("/connexion", async (req, res) => {
  const { phone_number, password = "" } = req.body;
  
  // Validation du numéro de téléphone
  if (!phone_number || !validatePhoneNumber(phone_number)) {
    return res.status(400).json({ error: "Numéro de téléphone invalide. Format requis: +[indicatif pays][numéro] (ex: +33123456789)" });
  }
  
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: "password requis (8 caractères minimum)." });
  }
  
  try {
    const response = await sql`SELECT * FROM users WHERE phone_number = ${phone_number}`;
    if (response.length === 0) {
      return res.status(401).json({ error: "Numéro de téléphone ou mot de passe incorrect" });
    }
    const isTrue = await bcrypt.compare(password, response[0].password);
    if (!isTrue)
      return res.status(401).json({ error: "Numéro de téléphone ou mot de passe incorrect" });
    const toSign = { id: response[0].id, username: response[0].username };
    const token = generateToken(toSign);
    res.cookie("token", token, { signed: true, httpOnly: true });
    return res.status(200).json({ id: response[0].id, token, phone_number: response[0].phone_number });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la connexion.", details: error.message });
  }
});

export default router;

import { Router } from "express";
import sql from "../db/db.js";
import { auth } from "./auth/auth.js";
const router = Router();

// Récupérer toutes les rooms de l'utilisateur
router.get("/", auth, async (req, res) => {
  const id = parseInt(req.id);
  try {
    const response = await sql`SELECT * FROM chatrooms WHERE participant1 = ${id} OR participant2 = ${id}`;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des rooms.", details: error.message });
  }
});

// Créer une nouvelle room
router.post("/", auth, async (req, res) => {
  const id = parseInt(req.id);
  const { participant } = req.body;
  if (!participant) {
    return res.status(400).json({ error: "Le participant est requis." });
  }
  try {
    // Vérifier que la room n'existe pas déjà
    const existing = await sql`SELECT * FROM chatrooms WHERE (participant1 = ${id} AND participant2 = ${participant}) OR (participant1 = ${participant} AND participant2 = ${id})`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "Une room existe déjà avec ce participant." });
    }
    await sql`INSERT INTO chatrooms (participant1, participant2) VALUES (${id}, ${participant})`;
    res.status(201).json({ response: "Chat room bien créée." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création de la room.", details: error.message });
  }
});

export default router;

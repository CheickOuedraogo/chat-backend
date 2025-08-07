import { Router } from "express";
import sql from "../db/db.js";
import { auth } from "./auth/auth.js";

const router = Router();

// Récupérer tous les messages d'une room (l'utilisateur doit être participant)
router.get("/:id", auth, async (req, res) => {
  const roomId = parseInt(req.params.id);
  const userId = parseInt(req.id);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  if (isNaN(roomId)) {
    return res.status(400).json({ error: "ID de room invalide." });
  }
  try {
    const room = await sql`SELECT * FROM chatrooms WHERE id = ${roomId} AND (participant1 = ${userId} OR participant2 = ${userId})`;
    if (room.length === 0) {
      return res.status(403).json({ error: "Accès refusé à cette room." });
    }
    const messages = await sql`SELECT * FROM messages WHERE room = ${roomId} ORDER BY date ASC LIMIT ${limit} OFFSET ${offset}`;
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des messages.", details: error.message });
  }
});

// Envoyer un message dans une room
router.post("/", auth, async (req, res) => {
  const { roomId, message } = req.body;
  const sender = parseInt(req.id);
  if (!roomId || !message) {
    return res.status(400).json({ error: "roomId et message sont requis." });
  }
  try {
    const room = await sql`SELECT * FROM chatrooms WHERE id = ${roomId} AND (participant1 = ${sender} OR participant2 = ${sender})`;
    if (room.length === 0) {
      return res.status(403).json({ error: "Vous n'avez pas accès à cette room." });
    }
    const date = new Date();
    const state = "ok";
    await sql`INSERT INTO messages (room, message, date, sender, state) VALUES (${roomId}, ${message}, ${date}, ${sender}, ${state})`;
    res.status(201).json({ response: "Message envoyé avec succès." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'envoi du message.", details: error.message });
  }
});

// Modifier un message (seul l'auteur peut modifier)
router.put("/:id", auth, async (req, res) => {
  const messageId = parseInt(req.params.id);
  const { message } = req.body;
  const userId = parseInt(req.id);
  if (!message) {
    return res.status(400).json({ error: "Le message est requis." });
  }
  try {
    const msg = await sql`SELECT * FROM messages WHERE id = ${messageId} AND sender = ${userId}`;
    if (msg.length === 0) {
      return res.status(403).json({ error: "Vous ne pouvez modifier que vos propres messages." });
    }
    await sql`UPDATE messages SET message = ${message} WHERE id = ${messageId}`;
    res.status(200).json({ response: "Message modifié." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la modification du message.", details: error.message });
  }
});

// Mettre à jour l'état d'un message (accusé de réception)
router.patch("/:id/state", auth, async (req, res) => {
  const messageId = parseInt(req.params.id);
  const { state } = req.body;
  if (!['ok', 'recu', 'lu'].includes(state)) {
    return res.status(400).json({ error: "État de message invalide." });
  }
  try {
    await sql`UPDATE messages SET state = ${state} WHERE id = ${messageId}`;
    res.status(200).json({ response: "État du message mis à jour." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'état du message.", details: error.message });
  }
});

// Supprimer un message (seul l'auteur peut supprimer)
router.delete("/:id", auth, async (req, res) => {
  const messageId = parseInt(req.params.id);
  const userId = parseInt(req.id);
  try {
    const msg = await sql`SELECT * FROM messages WHERE id = ${messageId} AND sender = ${userId}`;
    if (msg.length === 0) {
      return res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres messages." });
    }
    await sql`DELETE FROM messages WHERE id = ${messageId}`;
    return res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du message.", details: error.message });
  }
});

// Recherche de messages dans une room
router.get("/:id/search", auth, async (req, res) => {
  const roomId = parseInt(req.params.id);
  const userId = parseInt(req.id);
  const q = req.query.q || "";
  if (!q) return res.status(400).json({ error: "Requête de recherche manquante." });
  try {
    const room = await sql`SELECT * FROM chatrooms WHERE id = ${roomId} AND (participant1 = ${userId} OR participant2 = ${userId})`;
    if (room.length === 0) {
      return res.status(403).json({ error: "Accès refusé à cette room." });
    }
    const messages = await sql`SELECT * FROM messages WHERE room = ${roomId} AND message ILIKE ${'%' + q + '%'} ORDER BY date ASC`;
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la recherche de messages.", details: error.message });
  }
});

export default router;

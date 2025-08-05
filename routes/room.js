import { Router } from "express";
import sql from "../db/db.js";
import { auth } from "./auth/auth.js";
const router = Router();

//route de teste a supprimer
router.get("/test", async (req, res) => {
  try {
    const response = await sql`SELECT * FROM chatrooms C,users U WHERE C.participant1 = U.id OR C.participant2 = U.id `;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});


router.get("/",auth, async (req, res) => {
    const id = parseInt(req.id) 
  try {
    const response = await sql`SELECT * FROM chatrooms WHERE participant1 = ${id} OR participant2 = ${id} `;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/",auth, async (req, res) => {
  const { id = req.id, participant } = req.body;
  try {
    const response =
      await sql`INSERT INTO chatrooms (participant1, participant2) VALUES (${id},${participant})`;
    res.status(201).json({ response: "Chat room bien creer" });
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;

import { Router } from "express";
import sql from "../db/db.js";
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


router.get("/", async (req, res) => {
  try {
    const response = await sql`SELECT * FROM chatrooms`;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", async (req, res) => {
  const { participant1, participant2 } = req.body;
  try {
    const response =
      await sql`INSERT INTO chatrooms (participant1, participant2) VALUES (${participant1},${participant2})`;
    res.status(200).json({ response: "Chat room bien creer" });
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;

import { Router } from "express";
import sql from "../db/db.js";
//state : ok deleteAll deleteMe
const router = Router();

//route de teste a supprimer
router.get("/", async (req, res) => {
  try {
    const response = await sql`SELECT * FROM messages`;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});


router.get("/:id", async (req, res) => {
  const roomId = parseInt(req.params.id);
  try {
    const response = await sql`SELECT * FROM messages WHERE room = ${roomId}`;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", async (req, res) => {
  const { roomId, message, sender } = req.body;
  const date = new Date();
  const state = "ok";
  try {
    const response =
      await sql`INSERT INTO messages (room,message,date,sender,state) VALUES (${roomId},${message},${date},${sender},${state})`;
    res.status(200).json({response: "message send succes"});
  } catch (error) {
    res.status(500).json(error);
  }
});
router.put("/:id", async (req, res) => {
  const messageId = req.params.id;
  const { message } = req.body;
  try {
    const response =
      await sql`UPDATE messages SET message = ${message}  WHERE id = ${messageId} `;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;

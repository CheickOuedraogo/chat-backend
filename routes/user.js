import { Router } from "express";
import sql from "../db/db.js";
//state : ok deleteAll deleteMe
const router = Router();

//route de teste a supprimer
router.get("/", async (req, res) => {
  try {
    const response = await sql`SELECT * FROM users`;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/:id", async (req, res) => {
  const  userId  = req.params.id;
  try {
    const response =
      await sql`SELECT (id,username,email,password) FROM users WHERE id = ${userId}`;
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const response =
      await sql`INSERT INTO users (username, email, password) VALUES (${username},${email},${password}) RETURNING id`;
    res.status(200).json({id : response[0].id});
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router

import { Router } from "express";
import sql from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateToken } from "./auth/auth.js";

const router = Router();

//route de teste a supprimer
router.get("/", async (req, res) => {
  console.log(1);

  try {
    const response = await sql`SELECT * FROM users`;

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/id/:id", async (req, res) => {
  console.log(2);
  const userId = parseInt(req.params.id);
  try {
    const response = await sql`SELECT * FROM users WHERE id = ${userId}`;
    delete response[0].password;
    res.status(200).json({ response: response[0] });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/", async (req, res) => {
  console.log(3);
  const { username, email, password } = req.body;
  const salt = 12;
  const hash = await bcrypt.hash(password, salt);
  try {
    const response =
      await sql`INSERT INTO users (username, email, password) VALUES (${username},${email},${hash}) RETURNING id`;
    const toSign = { id: response[0].id, username: response[0].username };
    const token = generateToken(toSign);
    res.cookie("token", token, { signed: true, httpOnly: true });

    res.status(201).json({ id: response[0].id, token });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/connexion", async (req, res) => {
  console.log(4);

  const { email, password = "" } = req.body;

  try {
    const response = await sql`SELECT * FROM users WHERE email = ${email}`;
    const isTrue = await bcrypt.compare(password, response[0].password);
    if (!isTrue)
      return res.status(401).json({ error: "mail ou mot de passe incorect" });

    const toSign = { id: response[0].id, username: response[0].username };
    const token = generateToken(toSign);

    res.cookie("token", token, { signed: true, httpOnly: true });

    return res.status(200).json({ id: response[0].id, token });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/test", (req, res) => {
  console.log(5);

  console.log(req.headers["authorization"].trim().split(" ")[1]);
  //console.log(req.signedCookies);

  res.send("yo welcome");
});
export default router;

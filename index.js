import express from "express";
import routes from "./routes/routes.js";
import CookieParser from "cookie-parser";
import jwt from "jsonwebtoken";


const app = express();
const PORT = process.env.PORT || 5050;

//middleware
app.use(express.json());
app.use(CookieParser(process.env.COOKIE));

//routes
app.use("/api", routes);

//middleware erreur
app.use((req, res, next) => {
  res.status(404).json({
    error: "cette route n'existe pas",
  });
});
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("app listennig on http://localhost:" + PORT);
  });
}
export default app;

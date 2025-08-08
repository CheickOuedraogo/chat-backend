import postgres from "postgres";
import "dotenv/config.js";

const sql = postgres(process.env.DB_URL, {
  /*ssl: { rejectUnauthorized: false },*/
  max: 2,
  idle_timeout: 10,
  connect_timeout: 10,
});
async function tryConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log(`connexion reussi ${result[0].now}`);
  } catch (error) {
    console.log("erreur du serveur");
  }
}
async function initDb() {
  try {
    let result = await sql`CREATE TABLE IF NOT EXISTS users(
                id SERIAL PRIMARY KEY,
                username varchar(70) NOT NULL,
                phone_number varchar(20) NOT NULL UNIQUE,
                nom varchar(70),
                prenom varchar(70),
                email varchar(70),
                password varchar(60) NOT NULL
        );`;
    result = await sql`CREATE TABLE IF NOT EXISTS chatrooms(
                id SERIAL PRIMARY KEY,
                participant1 INT NOT NULL REFERENCES users(id),
                participant2 INT NOT NULL REFERENCES users(id)
    );`;
    result = await sql`CREATE TABLE IF NOT EXISTS messages(
                id SERIAL PRIMARY KEY,
                room INT REFERENCES chatrooms(id),
                message TEXT NOT NULL,
                date Date,
                sender INT REFERENCES users(id),
                state VARCHAR(20) NOT NULL
    );`;
  } catch (erreur) {
    console.log(`${erreur}`);
  }
}

if(process.env.NODE_ENV === 'production'){
  tryConnection();
  initDb();

}

export default sql;

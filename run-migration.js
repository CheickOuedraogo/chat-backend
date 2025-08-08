import migrateDatabase from "./db/migration.js";

console.log("Démarrage de la migration de la base de données...");
migrateDatabase()
  .then(() => {
    console.log("Migration terminée avec succès !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur lors de la migration:", error);
    process.exit(1);
  });

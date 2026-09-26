import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

process.on("unhandledRejection", (e) =>
  console.error("Unhandled rejection:", e),
);
process.on("uncaughtException", (e) => {
  console.error("Uncaught exception:", e);
  process.exit(1);
});

connectDB()
  .then(() =>
    app.listen(env.port, () => console.log(`API listening on :${env.port}✅`)),
  )
  .catch((e) => {
    console.error("Failed to start:", e.message);
    process.exit(1);
  });

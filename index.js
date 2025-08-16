import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

const app = express();
app.use(bodyParser.json());

// Firebase init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://giper-8fd92-default-rtdb.firebaseio.com",
});

const db = admin.database();

// ✅ Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, country, currency } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: "error", message: "Missing fields" });
    }

    await db.ref("users/" + username).set({
      username,
      password,
      balance: 0,
      country: country || "Uzbekistan",
      currency: currency || "UZS",
    });

    res.json({ status: "ok", username, balance: 0, currency: currency || "UZS" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ✅ Login
app.post("/api/auth", async (req, res) => {
  try {
    const { username, password } = req.body;
    const snapshot = await db.ref("users/" + username).once("value");
    if (!snapshot.exists()) return res.status(404).json({ status: "error", message: "User not found" });

    const user = snapshot.val();
    if (user.password !== password) return res.status(401).json({ status: "error", message: "Invalid password" });

    res.json({ status: "ok", username: user.username, balance: user.balance, currency: user.currency });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ✅ Balance
app.get("/api/balance", async (req, res) => {
  try {
    const { username } = req.query;
    const snapshot = await db.ref("users/" + username).once("value");
    if (!snapshot.exists()) return res.status(404).json({ status: "error", message: "User not found" });

    const user = snapshot.val();
    res.json({ status: "ok", balance: user.balance, currency: user.currency });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ✅ Logout (dummy)
app.post("/api/logout", (req, res) => {
  res.json({ status: "ok", message: "Logged out" });
});

// Vercel uchun
app.listen(3000, () => console.log("Server running on port 3000"));
export default app;

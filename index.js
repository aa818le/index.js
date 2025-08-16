const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

// Firebase Admin ulash
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://giper-8fd92-default-rtdb.firebaseio.com"
});

const db = admin.database();
const app = express();
app.use(bodyParser.json());

// 🔹 Register endpoint
app.post("/register", async (req, res) => {
  const { username, password, country, currency } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: "error", message: "Username va password kerak" });
  }

  const userRef = db.ref("users/" + username);
  const snapshot = await userRef.once("value");

  if (snapshot.exists()) {
    return res.json({ status: "error", message: "User allaqachon mavjud" });
  }

  await userRef.set({
    username,
    password,
    balance: 0,
    country: country || "Uzbekistan",
    currency: currency || "UZS"
  });

  return res.json({ status: "ok", message: "User yaratildi" });
});

// 🔹 Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: "error", message: "Username va password kerak" });
  }

  const userRef = db.ref("users/" + username);
  const snapshot = await userRef.once("value");

  if (!snapshot.exists()) {
    return res.json({ status: "error", message: "User topilmadi" });
  }

  const user = snapshot.val();

  if (user.password !== password) {
    return res.json({ status: "error", message: "Password noto‘g‘ri" });
  }

  return res.json({
    status: "ok",
    username: user.username,
    balance: user.balance,
    currency: user.currency,
    country: user.country
  });
});

// 🔹 Balance yangilash
app.post("/updateBalance", async (req, res) => {
  const { username, balance } = req.body;

  if (!username || balance === undefined) {
    return res.status(400).json({ status: "error", message: "Ma'lumot emas" });
  }

  const userRef = db.ref("users/" + username);
  const snapshot = await userRef.once("value");

  if (!snapshot.exists()) {
    return res.json({ status: "error", message: "User topilmadi" });
  }

  await userRef.update({ balance });
  return res.json({ status: "ok", message: "Balance yangilandi" });
});

// 🔹 Serverni ishga tushurish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server ishlayapti port:", PORT);
});

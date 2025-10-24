// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import Design from "./models/Design.js";
import { connectDB } from "./db.js"; // you already have this

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If your app is behind a proxy (Vercel, Heroku), enable trust proxy
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // trust first proxy
}

// CORS: allow your vercel origin and localhost (for local dev).
// You can set ORIGIN env var to your deployed origin e.g. "https://your-app.vercel.app"
const allowedOrigins = [
  process.env.ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null),
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Security / caching headers for pages that must not be cached
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // in case future fetch POSTs JSON

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Views (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session config
const isProd = process.env.NODE_ENV === "production";
const sessionCookie = {
  secure: isProd, // cookie only sent over HTTPS in production
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  sameSite: isProd ? "none" : "lax", // NONE required for cross-site cookies on HTTPS
};

app.use(
  session({
    secret: process.env.SESSION_SECRET || "castle_secret_123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 24 * 60 * 60, // 1 day in seconds
    }),
    cookie: sessionCookie,
  })
);

// Helper middlewares
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.send(`
      <script>
        alert("⚠️ Please log in to access this page.");
        window.location.href='/login';
      </script>
    `);
  }
  next();
}
function redirectIfLoggedIn(req, res, next) {
  if (req.session.userId) {
    return res.redirect("/YourChoices.html");
  }
  next();
}

// Connect DB and start server inside async function
async function start() {
  try {
    // connectDB() is your own utility. If not present, fallback to mongoose.connect
    if (typeof connectDB === "function") {
      await connectDB(); // expected to use process.env.MONGO_URI internally
      console.log("✅ MongoDB (via connectDB) connected");
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB Connected (via mongoose.connect)");
    }
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    // still start server so error pages can show? you may want to exit in prod
    // process.exit(1);
  }

  // ---------------- ROUTES ----------------

  app.get("/", (req, res) => {
    if (req.session.userId) {
      return res.sendFile(path.join(__dirname, "public", "YourChoices.html"));
    }
    res.render("interior");
  });

  app.get("/YourChoices.html", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "YourChoices.html"));
  });

  // Signup + Login
  app.get("/signup", redirectIfLoggedIn, (req, res) => {
    res.render("Signup", { messagedata: {} });
  });

  app.post("/signup", redirectIfLoggedIn, async (req, res) => {
    try {
      const { name, email, contactNumber, password, confirmPassword } = req.body;
      if (!name || !email || !contactNumber || !password || !confirmPassword)
        return res.render("Signup", { messagedata: { message: "All fields are required", sent: "False" } });

      if (password !== confirmPassword)
        return res.render("Signup", { messagedata: { message: "Passwords do not match", sent: "False" } });

      const existing = await User.findOne({ email });
      if (existing)
        return res.render("Signup", { messagedata: { message: "Email already registered", sent: "False" } });

      const hashed = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, contactNumber, password: hashed });
      await newUser.save();

      res.render("loginbutton", { messagedata: { message: "Signup successful! Please login now.", sent: "True" } });
    } catch (err) {
      console.error(" Signup Error:", err);
      res.render("Signup", { messagedata: { message: "Server error occurred", sent: "False" } });
    }
  });

  app.get("/login", redirectIfLoggedIn, (req, res) => {
    res.render("loginbutton", { messagedata: {} });
  });

  app.post("/login", redirectIfLoggedIn, async (req, res) => {
    try {
      const { Email_ID, Password } = req.body;
      const user = await User.findOne({ email: Email_ID });
      if (!user) return res.render("loginbutton", { messagedata: { message: "Invalid email or password", sent: "False" } });

      const isMatch = await bcrypt.compare(Password, user.password);
      if (!isMatch) return res.render("loginbutton", { messagedata: { message: "Invalid email or password", sent: "False" } });

      req.session.userId = user._id;
      req.session.userName = user.name;

      console.log("✅ User logged in:", user.email);
      res.redirect("/YourChoices.html");
    } catch (err) {
      console.error("❌ Login Error:", err);
      res.render("loginbutton", { messagedata: { message: "Server error occurred", sent: "False" } });
    }
  });

  // Save design
  app.post("/saveDesign", async (req, res) => {
    try {
      const { room, category, selection } = req.body;

      if (!req.session.userId) {
        return res.send(`
          <script>
            alert(" Please log in to save your designs.");
            window.location.href='/login';
          </script>
        `);
      }

      if (!room || !category || !selection) {
        return res.send(`
          <script>
            alert(" Missing required fields. Please try again.");
            window.history.back();
          </script>
        `);
      }

      const selectionArray = Array.isArray(selection) ? selection : [selection];

      await Design.findOneAndUpdate(
        { userId: req.session.userId, room, category },
        { $set: { selections: selectionArray } },
        { upsert: true, new: true }
      );

      console.log(`💾 Saved Design: ${req.session.userName} → ${room} → ${category} → ${selectionArray}`);

      res.send(`
        <script>
          alert(" Your ${room} ${category} selection(s) '${selectionArray.join(", ")}' have been saved successfully!");
          window.location.href='/YourChoices.html';
        </script>
      `);
    } catch (err) {
      console.error("❌ Error saving design:", err);
      res.status(500).send(`
        <script>
          alert(" Server error while saving your design.");
          window.history.back();
        </script>
      `);
    }
  });

  // Get user choices (used by YourChoices front-end)
  app.get("/getUserChoices", async (req, res) => {
    try {
      if (!req.session.userId) return res.json([]);
      const designs = await Design.find({ userId: req.session.userId });
      res.json(designs);
    } catch (err) {
      console.error("❌ Error fetching user choices:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Logout
  app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  // start server
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}

start();

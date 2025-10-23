import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import session from "express-session";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import Design from "./models/Design.js";
import { connectDB } from "./db.js";
dotenv.config();

const app = express();
const PORT = 3000;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(
  session({
    secret: process.env.SESSION_SECRET || "castle_secret_123",
    resave: false,
    saveUninitialized: false,
  })
);



await connectDB();


app.get("/", (req, res) => {
  if (req.session.userId) {
    
    res.sendFile(path.join(__dirname, "public", "YourChoices.html"));
  } else {
    
    res.render("interior");
  }
});

app.get("/YourChoices.html", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "YourChoices.html"));
});





app.get("/signup", redirectIfLoggedIn, (req, res) => {
  res.render("Signup", { messagedata: {} });
});

app.post("/signup", redirectIfLoggedIn, async (req, res) => {
  try {
    const { name, email, contactNumber, password, confirmPassword } = req.body;

    if (!name || !email || !contactNumber || !password || !confirmPassword)
      return res.render("Signup", {
        messagedata: { message: "All fields are required", sent: "False" },
      });

    if (password !== confirmPassword)
      return res.render("Signup", {
        messagedata: { message: "Passwords do not match", sent: "False" },
      });

    const existing = await User.findOne({ email });
    if (existing)
      return res.render("Signup", {
        messagedata: { message: "Email already registered", sent: "False" },
      });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, contactNumber, password: hashed });
    await newUser.save();

    res.render("loginbutton", {
      messagedata: {
        message: "Signup successful! Please login now.",
        sent: "True",
      },
    });
  } catch (err) {
    console.error(" Signup Error:", err);
    res.render("Signup", {
      messagedata: { message: "Server error occurred", sent: "False" },
    });
  }
});


app.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("loginbutton", { messagedata: {} });
});

app.post("/login", redirectIfLoggedIn, async (req, res) => {
  try {
    const { Email_ID, Password } = req.body;

    const user = await User.findOne({ email: Email_ID });
    if (!user)
      return res.render("loginbutton", {
        messagedata: { message: "Invalid email or password", sent: "False" },
      });

    const isMatch = await bcrypt.compare(Password, user.password);
    if (!isMatch)
      return res.render("loginbutton", {
        messagedata: { message: "Invalid email or password", sent: "False" },
      });

    
    req.session.userId = user._id;
    req.session.userName = user.name;

    console.log("✅ User logged in:", user.email);
    res.redirect("/YourChoices.html");
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.render("loginbutton", {
      messagedata: { message: "Server error occurred", sent: "False" },
    });
  }
});


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

    
    const selectionArray = Array.isArray(selection)
      ? selection
      : [selection];

   
    await Design.findOneAndUpdate(
      { userId: req.session.userId, room, category },
      { $set: { selections: selectionArray } },
      { upsert: true, new: true }
    );

    console.log(
      `💾 Saved Design: ${req.session.userName} → ${room} → ${category} → ${selectionArray}`
    );

    res.send(`
      <script>
        alert(" Your ${room} ${category} selection(s) '${selectionArray.join(
          ", "
        )}' have been saved successfully!");
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


app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});


app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

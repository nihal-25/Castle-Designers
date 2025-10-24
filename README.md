# 🏰 Castle Designers – Interior Design Web App

An interactive **interior design selection platform** built with **Node.js, Express, MongoDB, and EJS**.  
Users can sign up, log in, explore different rooms, select designs (like flooring, furniture, plants, etc.), and save their personalized preferences to their account — powered by persistent sessions.

---


## 📸 Demo
👉 [https://castle-designers.vercel.app](https://castle-designers.vercel.app)

---

## 🚀 Features

- 🔐 **User Authentication** – Secure signup and login using `bcrypt` hashing  
- 🏠 **Dynamic Room Pages** – Each room has interactive design selection (e.g., Flooring, Furniture, Plants)  
- 💾 **Save Preferences** – Stores selected designs to MongoDB via Express backend  
- 👤 **Persistent Sessions** – User remains logged in across pages (sessions stored in MongoDB)  
- 🧱 **EJS + Static HTML Support** – Mix of templated and static pages  
- 🌍 **Fully Deployed on Vercel** – Works seamlessly online  

---

## 🗂️ Folder Structure

```
interior-design-app/
├── models/
│   ├── User.js
│   └── Design.js
├── public/
│   ├── YourChoices.html
│   ├── Furniture.html
│   ├── Flooring.html
│   ├── Plants.html
│   ├── *.css, *.avif, *.png
│   └── new2.png
├── views/
│   ├── interior.ejs
│   ├── loginbutton.ejs
│   └── Signup.ejs
├── server.js
├── db.js
├── package.json
├── vercel.json
└── README.md
```

---

## ⚙️ Setup Instructions (Local Development)

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/interior-design-app.git
cd interior-design-app
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Create `.env` File
Create a `.env` file in the project root and add the following:
```bash
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
PORT=3000
```

### 4️⃣ Run the App Locally
```bash
npm run dev
```
Visit:  
👉 [http://localhost:3000](http://localhost:3000)

---

## 💻 Technologies Used

| Category | Tools |
|-----------|-------|
| **Frontend** | HTML5, CSS3, Vanilla JS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **Templating** | EJS |
| **Session Store** | connect-mongo |
| **Security** | bcrypt hashing, secure cookies |
| **Deployment** | Vercel |

---

## 📄 Example .env
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/interior
SESSION_SECRET=castle_secret_123
NODE_ENV=production
```

---

## 👨‍💻 Author

**Nihal Manjunath**  
  
📧 [nihal6mn@gmail.com]  
🌐 [https://www.nihalmanjunath.com/](nihalmanjunath.com)

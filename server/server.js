const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const folderRoutes = require("./routes/folderRoutes");
const imageRoutes = require("./routes/imageRoutes");
const connectDB = require("./db/db");

const app = express();

// Configure CORS with credentials
app.use(
  cors({
    origin: process.env.CLIENT_URL, // or your frontend URL
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/images", imageRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));

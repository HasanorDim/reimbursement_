import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import passport from "./config/passport.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import sequelize from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import reimbursementRoutes from "./routes/reimbursementRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import userRoutes from "./routes/user.routes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import adminRoutes from "./routes/admin.route.js";
import sapCodeRoutes from "./routes/sapCode.routes.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// Middleware
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(flash());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/api/reimbursements", reimbursementRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sap-codes", sapCodeRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "running", message: "✅ Backend is running" });
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ SIMPLE SERVER STARTUP - THIS WILL WORK
const PORT = process.env.PORT || 4000;
console.log("🔄 Starting server...");

sequelize
  .sync({ alter: false })
  .then(() => {
    console.log("✅ Database synced successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`🌐 App should be accessible now`);
    });
  })
  .catch((err) => {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  });

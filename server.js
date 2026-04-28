const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
require("dotenv").config();

const { initContracts }  = require("./utils/blockchain");
const authRoutes         = require("./routes/auth");
const adminRoutes        = require("./routes/admin");
const teacherRoutes      = require("./routes/teacher");
const { studentRouter, parentRouter } = require("./routes/studentParent");

const app = express();

/* ─── Core middleware ─── */
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

/* ─── Health ─── */
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

/* ─── Routes ─── */
app.use("/api/auth",    authRoutes);
app.use("/api/admin",   adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRouter);
app.use("/api/parent",  parentRouter);

/* ─── 404 ─── */
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

/* ─── Error handler ─── */
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

/* ─── Boot ─── */
const PORT = process.env.PORT || 5000;

initContracts()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`\n🚀 EduChain API running at http://localhost:${PORT}\n`)
    );
  })
  .catch(err => {
    console.error("Failed to init blockchain contracts:", err.message);
    console.error("Ensure Hardhat node is running and contracts are deployed.");
    process.exit(1);
  });

module.exports = app;

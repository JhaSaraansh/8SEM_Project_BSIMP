const jwt    = require("jsonwebtoken");
const { ethers } = require("ethers");

const JWT_SECRET  = process.env.JWT_SECRET  || "educhain-jwt-secret-change-in-prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "24h";

/* ─── Wallet-signature auth ─── */
function buildNonceMessage(address) {
  return (
    `Welcome to EduChain — Blockchain Student Management System\n` +
    `Sign this message to prove ownership of your wallet.\n` +
    `Address : ${address}\n` +
    `Nonce   : ${Date.now()}`
  );
}

function verifySignature(address, message, signature) {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

/* ─── JWT helpers ─── */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function decodeToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/* ─── Express middleware ─── */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    req.user = decodeToken(header.slice(7));
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = {
  buildNonceMessage,
  verifySignature,
  generateToken,
  decodeToken,
  authenticate,
  requireRole,
};

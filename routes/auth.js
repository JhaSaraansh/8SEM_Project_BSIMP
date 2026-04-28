const express = require("express");
const router  = express.Router();
const {
  buildNonceMessage,
  verifySignature,
  generateToken,
} = require("../middleware/auth");
const { getContract, roleToString } = require("../utils/blockchain");

/* Nonce map: address => message (in-memory; use Redis in production) */
const nonceStore = new Map();

/* GET /api/auth/nonce/:address */
router.get("/nonce/:address", (req, res) => {
  const address = req.params.address.toLowerCase();
  const message = buildNonceMessage(req.params.address);
  nonceStore.set(address, { message, createdAt: Date.now() });
  res.json({ message });
});

/* POST /api/auth/login  { address, message, signature } */
router.post("/login", async (req, res) => {
  try {
    const { address, message, signature } = req.body;
    if (!address || !message || !signature) {
      return res.status(400).json({ error: "address, message, signature required" });
    }

    // Verify nonce matches what we issued
    const stored = nonceStore.get(address.toLowerCase());
    if (!stored || stored.message !== message) {
      return res.status(401).json({ error: "Invalid or expired nonce" });
    }
    if (Date.now() - stored.createdAt > 5 * 60 * 1000) {
      nonceStore.delete(address.toLowerCase());
      return res.status(401).json({ error: "Nonce expired" });
    }
    nonceStore.delete(address.toLowerCase());

    // Verify signature
    if (!verifySignature(address, message, signature)) {
      return res.status(401).json({ error: "Signature mismatch" });
    }

    const contract = getContract("StudentManagement");
    const roleBytes = await contract.getRole(address);
    const user      = await contract.getUser(address);

    if (!user.isActive) {
      return res.status(403).json({ error: "Account deactivated" });
    }

    const role = roleToString(roleBytes);
    if (role === "unknown") {
      return res.status(403).json({ error: "Wallet not registered in system" });
    }

    const token = generateToken({ address, role, name: user.name });
    res.json({
      token,
      role,
      user: { address, name: user.name, email: user.email, role },
    });
  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/auth/me */
router.get("/me", require("../middleware/auth").authenticate, async (req, res) => {
  try {
    const contract = getContract("StudentManagement");
    const user     = await contract.getUser(req.user.address);
    res.json({ address: req.user.address, name: user.name, email: user.email, role: req.user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

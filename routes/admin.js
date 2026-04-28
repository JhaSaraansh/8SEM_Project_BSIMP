const express = require("express");
const router  = express.Router();
const { ethers } = require("ethers");
const { authenticate, requireRole } = require("../middleware/auth");
const { getContract, stringToRole }  = require("../utils/blockchain");

router.use(authenticate, requireRole("admin"));

/* ─── Stats ─── */
router.get("/stats", async (req, res) => {
  try {
    const sm  = getContract("StudentManagement");
    const am  = getContract("AssignmentManager");
    const gm  = getContract("GradeManager");
    const att = getContract("AttendanceTracker");
    const fm  = getContract("FeeManager");

    const [totalStudents, totalAssignments, totalResults, totalAttendance, totalCollected] =
      await Promise.all([
        sm.getTotalStudents(),
        am.getTotalAssignments(),
        gm.getTotalResults(),
        att.getTotalRecords(),
        fm.totalCollected(),
      ]);

    res.json({
      totalStudents:    Number(totalStudents),
      totalAssignments: Number(totalAssignments),
      totalResults:     Number(totalResults),
      totalAttendance:  Number(totalAttendance),
      totalCollected:   ethers.formatEther(totalCollected),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Students ─── */
router.get("/students", async (req, res) => {
  try {
    const sm    = getContract("StudentManagement");
    const total = Number(await sm.getTotalStudents());
    const students = [];
    for (let i = 1; i <= total; i++) {
      const s = await sm.getStudent(i);
      students.push({
        id: Number(s.id), name: s.name, email: s.email,
        grade: s.grade, department: s.department,
        walletAddress: s.walletAddress, isActive: s.isActive,
        enrollmentDate: Number(s.enrollmentDate),
      });
    }
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/students/enroll", async (req, res) => {
  try {
    const { wallet, name, email, dateOfBirth, grade, department } = req.body;
    const sm = getContract("StudentManagement");
    const tx = await sm.enrollStudent(wallet, name, email, dateOfBirth || 0, grade, department);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/students/:id", async (req, res) => {
  try {
    const { grade, department, isActive } = req.body;
    const sm = getContract("StudentManagement");
    const tx = await sm.updateStudent(req.params.id, grade, department, isActive);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── User Registration ─── */
router.post("/users/register", async (req, res) => {
  try {
    const { wallet, role, name, email } = req.body;
    const roleBytes = stringToRole(role);
    if (!roleBytes) return res.status(400).json({ error: "Invalid role" });
    const sm = getContract("StudentManagement");
    const tx = await sm.registerUser(wallet, roleBytes, name, email);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Parent Linking ─── */
router.post("/link-parent", async (req, res) => {
  try {
    const { parentAddress, studentAddress } = req.body;
    const sm = getContract("StudentManagement");
    const tx = await sm.linkParentToStudent(parentAddress, studentAddress);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Fee Management ─── */
router.post("/fees", async (req, res) => {
  try {
    const { student, feeType, amount, dueDate, academicYear, semester } = req.body;
    const fm = getContract("FeeManager");
    const tx = await fm.createFee(
      student, feeType,
      ethers.parseEther(amount.toString()),
      dueDate, academicYear, semester
    );
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/fees/:id/pay", async (req, res) => {
  try {
    const { txRef } = req.body;
    const fm = getContract("FeeManager");
    const tx = await fm.recordOffchainPayment(req.params.id, txRef);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/fees/:id/waive", async (req, res) => {
  try {
    const fm = getContract("FeeManager");
    const tx = await fm.waiveFee(req.params.id);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── All messages (admin view) ─── */
router.get("/messages/:address", async (req, res) => {
  try {
    const sm  = getContract("StudentManagement");
    const ids = await sm.getUserMessages(req.params.address);
    const msgs = await Promise.all(ids.map(id => sm.getMessage(id)));
    res.json(msgs.map(m => ({
      id: Number(m.id), sender: m.sender, recipient: m.recipient,
      content: m.content, timestamp: Number(m.timestamp), isRead: m.isRead,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

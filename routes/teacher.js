const express = require("express");
const router  = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { getContract } = require("../utils/blockchain");

router.use(authenticate, requireRole("teacher", "admin"));

/* ─── Assignments ─── */
router.get("/assignments", async (req, res) => {
  try {
    const am  = getContract("AssignmentManager");
    const ids = await am.getTeacherAssignments(req.user.address);
    const list = await Promise.all(ids.map(id => am.getAssignment(id)));
    res.json(list.map(a => ({
      id: Number(a.id), title: a.title, description: a.description,
      subject: a.subject, grade: a.grade, dueDate: Number(a.dueDate),
      maxScore: Number(a.maxScore), isActive: a.isActive,
      createdAt: Number(a.createdAt),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/assignments", async (req, res) => {
  try {
    const { title, description, subject, grade, dueDate, maxScore } = req.body;
    const am = getContract("AssignmentManager");
    const tx = await am.createAssignment(title, description, subject, grade, dueDate, maxScore);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/assignments/:id/submissions", async (req, res) => {
  try {
    const am   = getContract("AssignmentManager");
    const subs = await am.getAssignmentSubmissions(req.params.id);
    const list = await Promise.all(subs.map(id => am.getSubmission(id)));
    res.json(list.map(s => ({
      id: Number(s.id), assignmentId: Number(s.assignmentId),
      student: s.student, contentHash: s.contentHash,
      submittedAt: Number(s.submittedAt), isGraded: s.isGraded,
      score: Number(s.score), feedback: s.feedback,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/submissions/:id/grade", async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const am = getContract("AssignmentManager");
    const tx = await am.gradeSubmission(req.params.id, score, feedback);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Results ─── */
router.post("/results", async (req, res) => {
  try {
    const { student, subject, examType, score, maxScore, academicYear, semester } = req.body;
    const gm = getContract("GradeManager");
    const tx = await gm.publishResult(student, subject, examType, score, maxScore, academicYear, semester);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Attendance ─── */
router.post("/attendance", async (req, res) => {
  try {
    const { student, subject, date, status, notes } = req.body;
    const at = getContract("AttendanceTracker");
    const tx = await at.markAttendance(student, subject, date, status, notes || "");
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/attendance/batch", async (req, res) => {
  try {
    const { students, subject, date, statuses } = req.body;
    const at = getContract("AttendanceTracker");
    const tx = await at.batchMarkAttendance(students, subject, date, statuses);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Messaging ─── */
router.get("/messages", async (req, res) => {
  try {
    const sm  = getContract("StudentManagement");
    const ids = await sm.getUserMessages(req.user.address);
    const msgs = await Promise.all(ids.map(id => sm.getMessage(id)));
    res.json(msgs.map(m => ({
      id: Number(m.id), sender: m.sender, recipient: m.recipient,
      content: m.content, timestamp: Number(m.timestamp), isRead: m.isRead,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/messages", async (req, res) => {
  try {
    const { recipient, content } = req.body;
    const sm = getContract("StudentManagement");
    const tx = await sm.sendMessage(recipient, content);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

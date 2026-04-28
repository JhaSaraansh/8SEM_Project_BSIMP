// ──────────────────────────────────────────────────────
//  Student Routes
// ──────────────────────────────────────────────────────
const express  = require("express");
const sRouter  = express.Router();
const { ethers } = require("ethers");
const { authenticate, requireRole } = require("../middleware/auth");
const { getContract } = require("../utils/blockchain");

sRouter.use(authenticate, requireRole("student"));

sRouter.get("/profile", async (req, res) => {
  try {
    const sm = getContract("StudentManagement");
    const s  = await sm.getStudentByAddress(req.user.address);
    res.json({
      id: Number(s.id), name: s.name, email: s.email,
      grade: s.grade, department: s.department,
      walletAddress: s.walletAddress, isActive: s.isActive,
      enrollmentDate: Number(s.enrollmentDate),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

sRouter.get("/assignments", async (req, res) => {
  try {
    const sm     = getContract("StudentManagement");
    const am     = getContract("AssignmentManager");
    const student = await sm.getStudentByAddress(req.user.address);
    const ids     = await am.getAssignmentsByGrade(student.grade);
    const list    = await Promise.all(ids.map(id => am.getAssignment(id)));
    res.json(list.map(a => ({
      id: Number(a.id), title: a.title, description: a.description,
      subject: a.subject, dueDate: Number(a.dueDate), maxScore: Number(a.maxScore),
      isActive: a.isActive,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

sRouter.get("/submissions", async (req, res) => {
  try {
    const am   = getContract("AssignmentManager");
    const ids  = await am.getStudentSubmissions(req.user.address);
    const list = await Promise.all(ids.map(id => am.getSubmission(id)));
    res.json(list.map(s => ({
      id: Number(s.id), assignmentId: Number(s.assignmentId),
      contentHash: s.contentHash, submittedAt: Number(s.submittedAt),
      isGraded: s.isGraded, score: Number(s.score), feedback: s.feedback,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

sRouter.get("/results", async (req, res) => {
  try {
    const gm   = getContract("GradeManager");
    const ids  = await gm.getStudentResults(req.user.address);
    const list = await Promise.all(ids.map(id => gm.getResult(id)));
    res.json(list.map(r => ({
      id: Number(r.id), subject: r.subject, examType: r.examType,
      score: Number(r.score), maxScore: Number(r.maxScore), grade: r.grade,
      academicYear: r.academicYear, semester: r.semester,
      gradedAt: Number(r.gradedAt),
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

sRouter.get("/attendance", async (req, res) => {
  try {
    const at    = getContract("AttendanceTracker");
    const ids   = await at.getStudentRecords(req.user.address);
    const recs  = await Promise.all(ids.map(id => at.getRecord(id)));
    const stats = await at.getAttendanceStats(req.user.address);
    res.json({
      records: recs.map(r => ({
        id: Number(r.id), subject: r.subject, date: Number(r.date),
        status: Number(r.status), notes: r.notes,
      })),
      stats: {
        present: Number(stats.present), absent: Number(stats.absent),
        late: Number(stats.late), excused: Number(stats.excused),
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

sRouter.get("/fees", async (req, res) => {
  try {
    const fm    = getContract("FeeManager");
    const ids   = await fm.getStudentFees(req.user.address);
    const fees  = await Promise.all(ids.map(id => fm.getFee(id)));
    const outstanding = await fm.getOutstandingAmount(req.user.address);
    res.json({
      fees: fees.map(f => ({
        id: Number(f.id), feeType: f.feeType,
        amount: ethers.formatEther(f.amount), dueDate: Number(f.dueDate),
        status: Number(f.status), paidAt: Number(f.paidAt),
        academicYear: f.academicYear, semester: f.semester, txRef: f.txRef,
      })),
      outstanding: ethers.formatEther(outstanding),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

sRouter.get("/messages", async (req, res) => {
  try {
    const sm   = getContract("StudentManagement");
    const ids  = await sm.getUserMessages(req.user.address);
    const msgs = await Promise.all(ids.map(id => sm.getMessage(id)));
    res.json(msgs.map(m => ({
      id: Number(m.id), sender: m.sender, recipient: m.recipient,
      content: m.content, timestamp: Number(m.timestamp), isRead: m.isRead,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────
//  Parent Routes
// ──────────────────────────────────────────────────────
const pRouter = express.Router();
pRouter.use(authenticate, requireRole("parent"));

pRouter.get("/children", async (req, res) => {
  try {
    const sm       = getContract("StudentManagement");
    const addrs    = await sm.getChildrenOfParent(req.user.address);
    const children = await Promise.all(addrs.map(a => sm.getStudentByAddress(a)));
    res.json(children.map(s => ({
      id: Number(s.id), name: s.name, email: s.email,
      grade: s.grade, department: s.department, walletAddress: s.walletAddress,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pRouter.get("/children/:address/results", async (req, res) => {
  try {
    const gm   = getContract("GradeManager");
    const ids  = await gm.getStudentResults(req.params.address);
    const list = await Promise.all(ids.map(id => gm.getResult(id)));
    res.json(list.map(r => ({
      id: Number(r.id), subject: r.subject, examType: r.examType,
      score: Number(r.score), maxScore: Number(r.maxScore), grade: r.grade,
      academicYear: r.academicYear, semester: r.semester,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pRouter.get("/children/:address/attendance", async (req, res) => {
  try {
    const at    = getContract("AttendanceTracker");
    const ids   = await at.getStudentRecords(req.params.address);
    const recs  = await Promise.all(ids.map(id => at.getRecord(id)));
    const stats = await at.getAttendanceStats(req.params.address);
    res.json({
      records: recs.map(r => ({
        id: Number(r.id), subject: r.subject, date: Number(r.date), status: Number(r.status),
      })),
      stats: {
        present: Number(stats.present), absent: Number(stats.absent),
        late: Number(stats.late), excused: Number(stats.excused),
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pRouter.get("/children/:address/fees", async (req, res) => {
  try {
    const fm   = getContract("FeeManager");
    const ids  = await fm.getStudentFees(req.params.address);
    const fees = await Promise.all(ids.map(id => fm.getFee(id)));
    res.json(fees.map(f => ({
      id: Number(f.id), feeType: f.feeType,
      amount: ethers.formatEther(f.amount), dueDate: Number(f.dueDate),
      status: Number(f.status), academicYear: f.academicYear,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pRouter.get("/messages", async (req, res) => {
  try {
    const sm   = getContract("StudentManagement");
    const ids  = await sm.getUserMessages(req.user.address);
    const msgs = await Promise.all(ids.map(id => sm.getMessage(id)));
    res.json(msgs.map(m => ({
      id: Number(m.id), sender: m.sender, recipient: m.recipient,
      content: m.content, timestamp: Number(m.timestamp), isRead: m.isRead,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

pRouter.post("/messages", async (req, res) => {
  try {
    const { recipient, content } = req.body;
    const sm = getContract("StudentManagement");
    const tx = await sm.sendMessage(recipient, content);
    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.hash });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { studentRouter: sRouter, parentRouter: pRouter };

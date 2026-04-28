# ⛓️ EduChain — Blockchain Student Management System

A full-stack decentralised student management system built on **Ethereum (Solidity + Hardhat)** with an **Express.js** backend and a **React + Tailwind CSS** frontend.

---

## 🏗️ Architecture

```
educhain/
├── contracts/               ← Solidity smart contracts
│   ├── StudentManagement.sol    Core: roles, enrollment, messaging
│   ├── AssignmentManager.sol    Create / submit / grade assignments
│   ├── GradeManager.sol         Publish & query results
│   ├── AttendanceTracker.sol    Immutable daily attendance ledger
│   └── FeeManager.sol           Fee tracking & ETH-native payments
├── scripts/deploy.js        ← Deployment script (syncs ABIs to front/backend)
├── hardhat.config.js        ← Supports localhost, Sepolia, mainnet
├── backend/                 ← Express + ethers.js API
│   ├── server.js
│   ├── middleware/auth.js   ← JWT + wallet-signature verification
│   ├── utils/blockchain.js  ← Contract bindings
│   └── routes/
│       ├── auth.js          /api/auth/*
│       ├── admin.js         /api/admin/*
│       ├── teacher.js       /api/teacher/*
│       └── studentParent.js /api/student/* and /api/parent/*
└── frontend/                ← React 18 + Tailwind CSS
    └── src/components/
        ├── Login.jsx        MetaMask wallet-signature login
        ├── Navbar.jsx       Sidebar + shared layout components
        ├── AdminDashboard.jsx
        ├── TeacherDashboard.jsx
        ├── StudentDashboard.jsx
        └── ParentDashboard.jsx
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Git

### 1. Install dependencies
```bash
# Root (Hardhat)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — for local dev, defaults work out of the box
```

### 3. Start local Ethereum node
```bash
npm run node
# Starts Hardhat node at http://127.0.0.1:8545
# Prints 20 test accounts with 10000 ETH each
```

### 4. Deploy contracts
```bash
# In a new terminal:
npm run deploy:local
# Compiles + deploys all 5 contracts
# Auto-syncs addresses.json and ABIs to backend/ and frontend/
```

### 5. Start backend API
```bash
npm run backend   # http://localhost:5000
```

### 6. Start frontend
```bash
npm run frontend  # http://localhost:3000
```

### Or run everything at once
```bash
npm run dev
```

---

## 🌐 Deploy to Testnet (Sepolia)

```bash
# 1. Get Sepolia ETH from a faucet

# 2. Set in .env:
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_KEY

# 3. Deploy
npm run deploy:sepolia
```

---

## 👥 User Roles

| Role    | Description                                     |
|---------|-------------------------------------------------|
| Admin   | Full system access: enroll students, manage fees, register users |
| Teacher | Create assignments, mark attendance, publish results, message parents |
| Student | View assignments, submit work, see grades, attendance, fee status |
| Parent  | Monitor child's results, attendance, fees; message teachers |

---

## 📡 API Endpoints

### Auth
| Method | Path                     | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | `/api/auth/nonce/:addr`  | Get signing nonce              |
| POST   | `/api/auth/login`        | Login with wallet signature    |
| GET    | `/api/auth/me`           | Get current user (JWT)         |

### Admin
| Method | Path                         | Description               |
|--------|------------------------------|---------------------------|
| GET    | `/api/admin/stats`           | Dashboard statistics      |
| GET    | `/api/admin/students`        | List all students         |
| POST   | `/api/admin/students/enroll` | Enroll new student        |
| POST   | `/api/admin/users/register`  | Register teacher/parent   |
| POST   | `/api/admin/link-parent`     | Link parent to student    |
| POST   | `/api/admin/fees`            | Create fee record         |
| POST   | `/api/admin/fees/:id/pay`    | Record off-chain payment  |
| POST   | `/api/admin/fees/:id/waive`  | Waive a fee               |

### Teacher
| Method | Path                                  | Description            |
|--------|---------------------------------------|------------------------|
| GET    | `/api/teacher/assignments`            | My assignments         |
| POST   | `/api/teacher/assignments`            | Create assignment      |
| GET    | `/api/teacher/assignments/:id/submissions` | View submissions  |
| POST   | `/api/teacher/submissions/:id/grade`  | Grade submission       |
| POST   | `/api/teacher/results`                | Publish result         |
| POST   | `/api/teacher/attendance`             | Mark single attendance |
| POST   | `/api/teacher/attendance/batch`       | Batch mark attendance  |

### Student
| Method | Path                      | Description            |
|--------|---------------------------|------------------------|
| GET    | `/api/student/profile`    | My profile             |
| GET    | `/api/student/assignments`| Assignments for my grade |
| GET    | `/api/student/results`    | My grades              |
| GET    | `/api/student/attendance` | Attendance + stats     |
| GET    | `/api/student/fees`       | Fee status             |
| GET    | `/api/student/messages`   | My messages            |

### Parent
| Method | Path                                    | Description         |
|--------|-----------------------------------------|---------------------|
| GET    | `/api/parent/children`                  | My linked children  |
| GET    | `/api/parent/children/:addr/results`    | Child's results     |
| GET    | `/api/parent/children/:addr/attendance` | Child's attendance  |
| GET    | `/api/parent/children/:addr/fees`       | Child's fees        |
| POST   | `/api/parent/messages`                  | Send message        |

---

## ⛓️ Smart Contract Events

All on-chain state changes emit events for off-chain indexing:

- `StudentEnrolled(id, name, wallet)`
- `UserRegistered(wallet, role, name)`
- `AssignmentCreated(id, title, teacher, grade)`
- `AssignmentSubmitted(subId, assignId, student)`
- `AssignmentGraded(subId, score, feedback)`
- `ResultPublished(id, student, subject, score, grade)`
- `AttendanceMarked(id, student, status, subject)`
- `FeePaid(id, student, amount, txRef)`
- `MessageSent(id, sender, recipient)`

---

## 🔒 Security Notes

- JWT secret should be a strong random string in production
- `ADMIN_PRIVATE_KEY` should be a hardware wallet in production
- Nonce store is in-memory; use Redis in production
- Consider adding OpenZeppelin `AccessControl` and `ReentrancyGuard` for production contracts
- Enable rate limiting (express-rate-limit) on the API

---

## 📜 License

MIT

# My TripMate

🌐 **Live Demo:** [my-tripmate.netlify.app](https://my-tripmate.netlify.app/login)

> **เว็บแอปวางแผนท่องเที่ยวแบบกลุ่ม** — ...

---

## สารบัญ

- [ภาพรวมโปรเจค](#ภาพรวมโปรเจค)
- [Tech Stack](#-tech-stack)
- [โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)
- [Prerequisites](#-prerequisites)
- [การติดตั้ง](#-การติดตั้ง)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [API Endpoints](#-api-endpoints)
- [ฟีเจอร์หลัก](#-ฟีเจอร์หลัก)
- [Database Schema (ภาพรวม)](#-database-schema-ภาพรวม)
- [การ Deploy](#-การ-deploy)
- [Testing](#-testing)

---

## ภาพรวมโปรเจค

My TripMate ช่วยให้กลุ่มเพื่อนวางแผนท่องเที่ยวร่วมกันได้ง่ายขึ้น ตั้งแต่การสร้างทริป ส่ง Invite Link ให้เพื่อนเข้าร่วม ไปจนถึงการโหวตวัน สถานที่ และงบประมาณ พร้อม AI ช่วยแนะนำแผนการเดินทาง

**Workflow หลัก:**
```
เจ้าของสร้างทริป → แชร์ Invite Code/Link → เพื่อนส่ง Request → เจ้าของ Approve
→ สมาชิกโหวต (วัน / สถานที่ / งบ) → ดู Summary → ขอคำแนะนำจาก AI
```

---

## Tech Stack

### Frontend
| Package | Version | หน้าที่ |
|---|---|---|
| React | 18.2 | UI Framework |
| TypeScript | 5.2 | Type Safety |
| Vite | 4.5 | Build Tool / Dev Server |
| React Router DOM | 6.16 | Client-side Routing |
| Tailwind CSS | 3.4 | Styling |
| Recharts | 3.5 | Charts & Data Visualization |
| Lucide React | 0.554 | Icon Library |
| Socket.IO Client | 4.8 | Real-time Communication |
| Axios | 1.13 | HTTP Client |
| DOMPurify | 3.3 | XSS Protection |

### Backend
| Package | Version | หน้าที่ |
|---|---|---|
| Node.js + Express | 5.1 | REST API Server |
| TypeScript + tsx | 5.9 | Type Safety / Dev Runtime |
| MySQL2 | 3.15 | Database Driver (Raw SQL) |
| Socket.IO | 4.8 | Real-time Events |
| Passport.js | 0.7 | Auth Middleware |
| google-auth-library | 10.5 | Google ID Token Verification |
| jsonwebtoken | 9.0 | JWT (Access + Refresh Token) |
| cookie-parser | 1.4 | Cookie Handling |
| Nodemailer | 8.0 | Email Notifications |
| OpenAI | 6.22 | AI Trip Planning |
| uuid | 9.0 | UUID Generation |
| dotenv | 17.2 | Environment Variables |

### Dev & Testing
| Package | หน้าที่ |
|---|---|
| Vitest | Unit Testing (Backend) |
| Jest | Test Framework |
| Supertest | API Integration Testing |

---

## โครงสร้างโปรเจค

```
my-tripmate-wepapp/
├── frontend/
│   ├── public/
│   │   └── _redirects              # Netlify SPA redirect
│   └── src/
│       ├── assets/                 # รูปภาพ (login-bg, google logo)
│       ├── components/
│       │   └── Header.tsx
│       ├── config/
│       │   └── app.config.ts       # Base URL config
│       ├── constants/
│       │   └── provinces.ts        # รายชื่อจังหวัด (สำหรับโหวตสถานที่)
│       ├── contexts/
│       │   └── AuthContext.tsx     # Global Auth State
│       ├── guards/
│       │   └── ProtectedRoute.tsx  # Route Guard (ต้อง Login)
│       ├── pages/
│       │   ├── LoginPage.tsx       # Google OAuth Login
│       │   ├── HomePage.tsx        # หน้าแรก / สร้างทริปใหม่
│       │   ├── Dashboard.tsx       # รายการทริปของฉัน
│       │   ├── JoinPage.tsx        # เข้าร่วมทริปผ่าน Invite Link
│       │   └── VotePage/
│       │       ├── VotePage.tsx    # Main Vote Container (4 Steps)
│       │       ├── components/
│       │       │   ├── StepVote.tsx    # Step 1: เลือกวันที่ว่าง
│       │       │   ├── StepPlace.tsx   # Step 2: โหวตสถานที่ (จังหวัด)
│       │       │   ├── StepBudget.tsx  # Step 3: กำหนดงบประมาณ
│       │       │   └── StepSummary.tsx # Step 4: สรุปผลโหวต + AI
│       │       └── hooks/
│       │           ├── useTripData.ts  # Fetch ข้อมูลทริป
│       │           └── useToast.ts     # Toast Notifications
│       ├── services/
│       │   ├── apiClient.ts        # Axios Instance + Interceptors
│       │   └── tripService.ts      # API Calls สำหรับ Trip
│       ├── socket.ts               # Socket.IO Client Setup
│       ├── types/index.ts          # TypeScript Types/Interfaces
│       └── utils/index.ts
│
├── backend/
│   └── src/
│       ├── config/
│       │   └── db.ts               # MySQL Connection Pool
│       ├── controllers/
│       │   ├── authController.ts   # Google Login, Me, Refresh, Logout
│       │   ├── TripController.ts   # CRUD ทริป + จัดการสมาชิก
│       │   ├── voteController.ts   # โหวตวัน / สถานที่ / งบ
│       │   └── notiController.ts   # Notifications
│       ├── middleware/
│       │   ├── auth.ts             # JWT Verification Middleware
│       │   ├── role.ts             # requireTripOwner / requireTripMember
│       │   └── validate.ts         # Request Validation
│       ├── models/
│       │   ├── userModel.ts        # User CRUD
│       │   ├── tripModel.ts        # Trip + Member queries (Raw SQL + Transactions)
│       │   ├── voteModel.ts        # Vote queries (Date / Location / Budget)
│       │   └── notiModel.ts        # Notification queries
│       ├── routes/
│       │   ├── user.ts             # /api/auth/*
│       │   ├── trip.ts             # /api/trips/*
│       │   ├── vote.ts             # /api/votes/*
│       │   └── noti.ts             # /api/noti/*
│       ├── services/
│       │   ├── authService.ts      # Google Token → User
│       │   ├── tripService.ts      # Business Logic ทริป
│       │   ├── voteService.ts      # Business Logic โหวต
│       │   ├── notiService.ts      # สร้าง / ส่ง Notifications
│       │   ├── email.service.ts    # Nodemailer Wrapper
│       │   └── promptService.ts    # OpenAI Prompt Builder (5 templates)
│       ├── socket/
│       │   └── socket.ts           # Socket.IO Server + Room Management
│       ├── templates/
│       │   └── emailTemplates.ts   # HTML Email Templates
│       ├── test/
│       │   ├── authController.test.ts
│       │   ├── TripController.test.ts
│       │   ├── voteController.test.ts
│       │   └── notiController.test.ts
│       ├── express.d.ts            # Express Type Augmentation
│       └── server.ts               # Bootstrap (Express + Socket.IO)
│
├── scripts/
│   └── generate-readme.js
└── package.json
```

---

## Prerequisites

- **Node.js** v18 หรือสูงกว่า
- **npm** v9 หรือสูงกว่า
- **MySQL** v8 หรือสูงกว่า
- **Google Cloud Project** ที่มี OAuth 2.0 Credentials (Client ID)
- **OpenAI API Key** (สำหรับฟีเจอร์ AI แนะนำทริป)
- **Gmail App Password** (สำหรับส่ง Email)

---

## การติดตั้ง

### 1. Clone repository

```bash
git clone https://github.com/your-org/my-tripmate-wepapp.git
cd my-tripmate-wepapp
```

### 2. ติดตั้ง dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 3. ตั้งค่า Environment Variables

```bash
cp backend/.env.example backend/.env
# แก้ไขค่าใน backend/.env ตามหัวข้อด้านล่าง
```

### 4. สร้างฐานข้อมูล

```sql
CREATE DATABASE tripmate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> ต้อง migrate ตาราง (users, trips, trip_members, date_votings, date_options, date_votes, location_votings, location_options, location_votes, budget_votings, budget_options, budget_votes, notifications) แยกต่างหาก

### 5. รันแอปพลิเคชัน

```bash
# รัน Frontend + Backend พร้อมกัน (จาก root)
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:5000 |

---

## Environment Variables

สร้างไฟล์ `backend/.env`:

```env
# ── Server ──────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tripmate_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# ── JWT ─────────────────────────────────────────
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# ── Google OAuth ─────────────────────────────────
# ใช้ Client ID ฝั่ง Backend เพื่อ verify ID Token
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# ── CORS / Frontend ──────────────────────────────
FRONTEND_URL=http://localhost:5173
FRONTEND_BASE_URL=http://localhost:5173

# ── OpenAI ──────────────────────────────────────
OPENAI_API_KEY=sk-...

# ── Email (Nodemailer / Gmail) ───────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM="My TripMate <your_email@gmail.com>"
```

**หมายเหตุ:** Frontend ใช้ Google Client ID ผ่าน Vite env (`VITE_GOOGLE_CLIENT_ID`) ใน `frontend/.env`

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

---

## Scripts

### Root (รัน 2 services พร้อมกัน)
```bash
npm run dev        # concurrently รัน backend + frontend
npm run gen:readme # auto-generate README
```

### Backend (`cd backend`)
```bash
npm run dev        # tsx src/server.ts (hot reload)
npm run build      # tsc → dist/
npm run start      # node dist/server.js (production)
npm run test       # vitest
npm run test:watch # vitest --watch
```

### Frontend (`cd frontend`)
```bash
npm run dev        # vite dev server
npm run build      # vite build → dist/
npm run preview    # preview production build
```

---

##  API Endpoints

### Auth — `/api/auth`
| Method | Path | หน้าที่ | Auth Required |
|---|---|---|---|
| POST | `/google` | รับ Google ID Token → ออก JWT Cookie | - |
| GET | `/me` | ดึงข้อมูล user ปัจจุบัน | ✅ |
| POST | `/refresh` | ต่ออายุ Access Token | - |
| POST | `/logout` | Clear JWT Cookie | - |

### Trips — `/api/trips`
| Method | Path | หน้าที่ | Auth Required |
|---|---|---|---|
| POST | `/add-trip` | สร้างทริปใหม่ (พร้อม Invite Code) | ✅ |
| GET | `/all-my-trips` | รายการทริปของฉันทั้งหมด | ✅ |
| GET | `/:tripId` | รายละเอียดทริป | ✅ |
| DELETE | `/:tripId` | ลบทริป | ✅ Owner |
| GET | `/:tripId/summary` | สรุปผลทริป | ✅ |
| POST | `/request-join` | ขอเข้าร่วมทริป (Invite Code) | ✅ |
| GET | `/:tripId/pending-requests` | ดู Request ที่รอ Approve | ✅ |
| PATCH | `/:tripId/approve/:userId` | Approve สมาชิก | ✅ |
| PATCH | `/:tripId/reject/:userId` | Reject สมาชิก | ✅ |
| GET | `/:tripId/get-members` | รายชื่อสมาชิก | ✅ |
| DELETE | `/:tripId/members/:memberId` | ลบสมาชิกออกจากทริป | ✅ Owner |
| PATCH | `/:tripId/manual-close` | ปิดทริปด้วยตนเอง | ✅ Owner |
| POST | `/:tripId/edit-describe` | แก้ไขรายละเอียดทริป | ✅ Owner |
| POST | `/:tripId/addLink` | เพิ่ม Summary Link | ✅ Owner |

### Votes — `/api/votes`
| Method | Path | หน้าที่ | Auth Required |
|---|---|---|---|
| POST | `/availability` | บันทึกวันที่ว่าง | ✅ |
| GET | `/:tripId/date-matching-result` | ผลวันที่ว่างร่วมกัน | ✅ |
| POST | `/:tripId/vote-place` | โหวตสถานที่ (จังหวัด + Score) | ✅ |
| GET | `/:tripId/get-vote-place` | ผลโหวตสถานที่ | ✅ |
| POST | `/:tripId/budget` | บันทึกงบประมาณ (ต่อหมวด) | ✅ |
| GET | `/:tripId/get-budget` | ผลงบประมาณรวม | ✅ |

### Notifications — `/api/noti`
| Method | Path | หน้าที่ | Auth Required |
|---|---|---|---|
| GET | `/get-noti` | Notifications ทั้งหมดของฉัน | ✅ |
| GET | `/unread-count` | จำนวนที่ยังไม่อ่าน (Bell Icon) | ✅ |
| PATCH | `/:id/read` | Mark as Read (อันเดียว) | ✅ |
| PATCH | `/read-all` | Mark All as Read | ✅ |
| DELETE | `/notifications/:id` | ลบ Notification | ✅ |

---

##  ฟีเจอร์หลัก

###  Authentication
- **Google Sign-In Only** ผ่าน `@react-oauth/google` ฝั่ง Frontend
- Backend verify Google ID Token ด้วย `google-auth-library` (ไม่ผ่าน OAuth Redirect)
- **JWT** แบบ 2 Token: Access Token (short-lived) + Refresh Token (Cookie `httpOnly`)
- **Auto Token Refresh** ผ่าน Axios Interceptor ใน `apiClient.ts`
- **Protected Routes** ผ่าน `<ProtectedRoute>` + `AuthContext`

###  Trip Management
- สร้างทริปพร้อม **Invite Code** (8 หลัก random) และ **Invite Link** โดยอัตโนมัติ
- ระบบ **Request to Join** — ผู้ใช้ส่ง Request ผ่าน Invite Code → เจ้าของ Approve หรือ Reject
- **Role System**: `owner` (เจ้าของ) / `member` (สมาชิก) ควบคุมสิทธิ์ผ่าน Middleware
- **Trip Status Flow**: `planning` → `voting` → `confirmed` / `completed` / `archived`
- การลบสมาชิก (Soft Delete) พร้อมล้างโหวตทั้งหมดด้วย **MySQL Transaction**

### 🗳️ Vote System (4 Steps)

| Step | Component | รายละเอียด |
|---|---|---|
| 1 | `StepVote` | Date Picker เลือกวันที่ว่าง (เลือกได้หลายวัน, บันทึกทีละวัน) |
| 2 | `StepPlace` | โหวตจังหวัด ด้วยระบบ Score (อันดับ 1=3 คะแนน, 2=2, 3=1) |
| 3 | `StepBudget` | กำหนดงบแยกหมวด: ที่พัก / เดินทาง / อาหาร / อื่นๆ |
| 4 | `StepSummary` | สรุปผลโหวต + Recharts + ขอคำแนะนำจาก AI |

### AI Trip Recommendations (OpenAI)

`PromptService` รองรับ 5 templates ทั้งหมดตอบกลับเป็น **ภาษาไทย**:

| Template | หน้าที่ |
|---|---|
| `comprehensive` | วิเคราะห์ครบทุกด้าน (Default) พร้อม Chain-of-Thought และ Few-shot |
| `itinerary` | ตารางการเดินทาง Day-by-Day แบบ Hour-by-Hour |
| `budget` | วิเคราะห์ความเป็นไปได้ของงบ + Tips ประหยัด |
| `activities` | แนะนำกิจกรรมแยก 6 หมวด (วัฒนธรรม ธรรมชาติ อาหาร ฯลฯ) |
| `accommodation` | แนะนำที่พัก 3-5 ตัวเลือกตามงบและขนาดกลุ่ม |

รองรับ **Structured JSON Output** สำหรับ parse ผลลัพธ์บน Frontend

### Real-time (Socket.IO)
- User Personal Room: `user_<userId>` — รับ Notification ส่วนตัว
- Trip Room: `trip_<tripId>` — รับ Update ของทริปนั้นๆ
- Events: Join Request, Approve, Reject, Vote Update

### Email Notifications
- ส่งผ่าน Nodemailer (Gmail SMTP)
- HTML Templates แยกใน `emailTemplates.ts`
- ส่งเมื่อ: มีคนขอ Join, Approve/Reject สมาชิก, ปิดทริป

---

## Database Schema (ภาพรวม)

```
users
  └── trip_members ──────────── trips
                                  ├── date_votings
                                  │    └── date_options
                                  │         └── date_votes (user_id, available_date)
                                  ├── location_votings
                                  │    └── location_options (province_name)
                                  │         └── location_votes (user_id, score)
                                  ├── budget_votings
                                  │    └── budget_options (category_name, estimated_amount)
                                  │         └── budget_votes (user_id, category_name, estimated_amount)
                                  └── notifications (user_id, type, is_read)
```

> ใช้ **Raw SQL** ผ่าน `mysql2` Pool — ไม่ใช้ ORM  
> ทุก Write Operation ที่เกี่ยวข้องหลายตาราง ใช้ **Transaction** เสมอ

---

## การ Deploy

### Frontend → Netlify

```bash
cd frontend
npm run build
# Deploy โฟลเดอร์ dist/ ขึ้น Netlify
```

ไฟล์ `public/_redirects` รองรับ React Router SPA:
```
/* /index.html 200
```

### Backend → Railway / Render / VPS

```bash
cd backend
npm run build   # tsc → dist/
npm run start   # node dist/server.js
```

ตั้งค่า Environment Variables บน Platform ให้ครบตามหัวข้อ `.env` ด้านบน  
ตั้ง `FRONTEND_URL` เป็น URL ของ Netlify จริง เช่น `https://my-tripmate.netlify.app`

---

## Testing

```bash
cd backend
npm run test          # รัน Vitest ครั้งเดียว
npm run test:watch    # รัน Vitest แบบ watch mode
```

Test files ครอบคลุม:
- `authController.test.ts` — Google Login, Token Refresh, Logout
- `TripController.test.ts` — add/delete Trip, Join/Approve/Reject, Member Management
- `voteController.test.ts` — Date/Place/Budget Voting
- `notiController.test.ts` — Notification CRUD

---

## ทีมผู้พัฒนา

**My TripMate Team**

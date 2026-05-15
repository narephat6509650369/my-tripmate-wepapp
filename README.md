# My TripMate Web App

My TripMate เป็นเว็บแอปสำหรับวางแผนทริปแบบกลุ่ม สมาชิกสามารถขอเข้าร่วมทริป โหวตวันที่ งบประมาณ และสถานที่ จากนั้นระบบสรุปผลเพื่อช่วยเจ้าของทริปตัดสินใจและสร้าง prompt สำหรับนำไปใช้กับ AI วางแผนการเดินทางต่อได้

## Directory Tree

```text
my-tripmate-wepapp/
├─ frontend/
│  ├─ src/
│  │  ├─ components/        # Header, navigation, shared UI
│  │  ├─ config/            # frontend config from Vite env
│  │  ├─ constants/         # static data เช่น provinces
│  │  ├─ contexts/          # AuthContext และ auth state
│  │  ├─ data/              # mock data สำหรับ development
│  │  ├─ guards/            # route guards
│  │  ├─ pages/             # Login, Home, Dashboard, Join, Vote pages
│  │  │  └─ VotePage/
│  │  │     ├─ components/  # StepVote, StepBudget, StepPlace, StepSummary
│  │  │     └─ hooks/       # hooks เฉพาะหน้า VotePage
│  │  ├─ services/          # API client และ trip/vote/noti services
│  │  ├─ types/             # TypeScript shared types
│  │  ├─ utils/             # validation, formatters, helpers
│  │  ├─ socket.ts          # Socket.IO client
│  │  └─ index.tsx          # React entry point
│  ├─ package.json
│  └─ .env                  # frontend environment variables
├─ backend/
│  ├─ src/
│  │  ├─ config/            # passport/auth config
│  │  ├─ controllers/       # request handlers
│  │  ├─ middleware/        # auth and role middleware
│  │  ├─ models/            # database query layer
│  │  ├─ routes/            # Express route definitions
│  │  ├─ services/          # business logic, email, notification, AI prompt
│  │  ├─ socket/            # Socket.IO server setup
│  │  ├─ test/              # backend tests
│  │  └─ server.ts          # backend entry point
│  ├─ package.json
│  └─ .env                  # backend environment variables
├─ scripts/
├─ package.json             # root scripts
└─ README.md
```

## Required Software

ติดตั้งโปรแกรมต่อไปนี้ก่อนใช้งาน

- Git
- Node.js 22.x หรือเวอร์ชันที่รองรับ TypeScript/Vite
- npm
- MySQL-compatible database หรือ TiDB Cloud
- Google OAuth Client ID สำหรับเข้าสู่ระบบด้วย Google
- Email account/app password สำหรับส่งอีเมลแจ้งเตือน
- OpenAI API key สำหรับส่วนสร้าง prompt/summary ด้วย AI

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, React Router, Socket.IO Client
- Backend: Node.js, Express, TypeScript, Socket.IO, MySQL2/TiDB, Passport Google OAuth, Nodemailer
- Tooling: npm, Vite, Vitest, TypeScript

## Installation

1. Clone repository

```bash
git clone https://github.com/narephat6509650369/my-tripmate-wepapp.git
cd my-tripmate-wepapp
```

2. Install dependencies

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

## Environment Setup

สร้างไฟล์ `.env` ใน `frontend/` และ `backend/` ก่อนรันโปรแกรม

### frontend/.env

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MOCK_AUTH=false
VITE_USE_MOCK=false
```

### backend/.env

```env
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=4000

PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_IN=7
COOKIE_SECURE=false
ACCESS_SECRET=your-access-secret
REFRESH_SECRET=your-refresh-secret

OPENAI_API_KEY=your-openai-api-key
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
```

อย่า commit ค่า secret จริง เช่น database password, Google client secret, JWT secret, OpenAI API key หรือ email app password ลง repository

## Running The Application

### Run frontend and backend separately

Backend:

```bash
npm run dev --prefix backend
```

Frontend:

```bash
npm run dev --prefix frontend
```

เปิดเว็บที่:

```text
http://localhost:5173
```

Backend API และ Socket.IO ใช้:

```text
http://localhost:5000
```

### Run both from root

```bash
npm run dev
```

## Build

Frontend:

```bash
npm run build --prefix frontend
```

Backend:

```bash
npm run build --prefix backend
```

หลัง build backend แล้วสามารถรัน production build ได้ด้วย:

```bash
npm start --prefix backend
```

## Testing

Backend:

```bash
npm test --prefix backend
```

Frontend ปัจจุบันยังไม่มี test script แยก ให้ตรวจด้วย build:

```bash
npm run build --prefix frontend
```

## How To Use

1. เข้าสู่ระบบด้วย Google
2. สร้างทริปใหม่โดยกรอกชื่อ รายละเอียด และจำนวนวัน
3. แชร์ invite code หรือ invite link ให้สมาชิก
4. สมาชิกกดขอเข้าร่วมทริป
5. เจ้าของทริปอนุมัติหรือปฏิเสธคำขอในหน้า VotePage
6. สมาชิกโหวตวันที่ที่สะดวกใน StepVote
7. สมาชิกกรอกงบประมาณใน StepBudget
8. สมาชิกโหวตสถานที่หรือจังหวัดใน StepPlace
9. เจ้าของทริปปิดโหวตเมื่อข้อมูลครบหรือพร้อมสรุป
10. ดูผลสรุปใน StepSummary และคัดลอก prompt ไปใช้กับ AI เพื่อวางแผนทริป

## Realtime Features

ระบบใช้ Socket.IO สำหรับ realtime events เช่น

- แจ้งเตือนคำขอเข้าร่วมทริป
- อัปเดตจำนวน notification
- อัปเดตสมาชิกเมื่ออนุมัติหรือปฏิเสธคำขอ
- อัปเดตผลโหวตวันที่ งบประมาณ และสถานที่
- แจ้งเตือนเมื่อทริปถูกปิด ยืนยัน หรือลบ

ต้องตั้งค่า `VITE_SOCKET_URL` ให้ตรงกับ backend เช่น `http://localhost:5000`

## Main Features

- Google login
- Create and manage trips
- Invite code and join request workflow
- Owner/member role separation
- Date voting
- Budget voting
- Location voting
- Realtime notification
- Trip summary and AI prompt export

## Notes

- ถ้า backend ขึ้น error `EADDRINUSE: address already in use 0.0.0.0:5000` แปลว่ามี backend process เก่ารันอยู่ ให้หยุด process เดิมก่อน
- ถ้า notification หรือ socket ไม่ทำงาน ให้ตรวจว่า backend รันอยู่ และ `VITE_SOCKET_URL` ตรงกับ backend port
- ถ้า frontend เรียก API ไม่ได้ ให้ตรวจ `VITE_API_BASE_URL` และ `FRONTEND_URL` ใน backend `.env`

## Author

My TripMate Team

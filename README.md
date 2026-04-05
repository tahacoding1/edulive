# ◈ EduLive — Virtual Classroom Platform

A full-stack MERN virtual classroom app with real-time whiteboard, live chat, video/screen sharing, assignments, and participant management.

---

## 🗂 Project Structure

```
edulive/
├── backend/              # Node.js + Express + MongoDB
│   ├── models/           # Mongoose models
│   ├── routes/           # REST API routes
│   ├── middleware/       # JWT auth middleware
│   ├── socket/           # Socket.io real-time events
│   ├── server.js         # Entry point
│   └── .env.example      # Environment variables template
│
└── frontend/             # React + Vite + Tailwind CSS
    ├── src/
    │   ├── pages/        # AuthPage, DashboardPage, ClassroomPage
    │   ├── components/   # Whiteboard, Chat, Video, Participants, Assignments
    │   ├── context/      # AuthContext (global user state)
    │   └── utils/        # axios (api.js) & socket.io (socket.js)
    └── tailwind.config.js
```

---

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

---

### 1. Clone & Install

```bash
# Backend
cd edulive/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/edulive
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:5173
```

---

### 3. Run

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## ✨ Features

| Feature              | Description                                      |
|---------------------|--------------------------------------------------|
| 🔐 Auth              | JWT-based register/login with teacher/student roles |
| 🏫 Room Management   | Create rooms with generated ID + password; join with credentials |
| 🖊 Whiteboard         | Real-time collaborative drawing synced via Socket.io |
| 💬 Live Chat         | Persistent chat history saved to MongoDB          |
| 📹 Video/Screen Share| Browser MediaDevices API (camera + screen sharing) |
| 👥 Participants       | Real-time list; teacher can remove students or allow speech |
| ✋ Raise Hand         | Students raise hand; teacher sees notification    |
| 📋 Assignments        | Teacher posts tasks; students submit files (stored server-side) |
| 📴 End Session        | Teacher ends room and disconnects all participants |

---

## 🛠 API Endpoints

### Auth
| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| POST   | `/api/auth/register` | Register user       |
| POST   | `/api/auth/login`    | Login               |
| GET    | `/api/auth/me`       | Get current user    |

### Rooms
| Method | Endpoint                              | Description             |
|--------|---------------------------------------|-------------------------|
| POST   | `/api/rooms`                          | Create room (teacher)   |
| POST   | `/api/rooms/join`                     | Join room               |
| GET    | `/api/rooms/:roomId`                  | Get room info           |
| PATCH  | `/api/rooms/:roomId/end`              | End session             |
| DELETE | `/api/rooms/:roomId/participants/:id` | Remove participant      |

### Messages
| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| GET    | `/api/messages/:roomId`   | Get last 100 messages |
| POST   | `/api/messages/:roomId`   | Post a message        |

### Assignments
| Method | Endpoint                               | Description            |
|--------|----------------------------------------|------------------------|
| GET    | `/api/assignments/:roomId`             | List assignments       |
| POST   | `/api/assignments/:roomId`             | Create assignment      |
| POST   | `/api/assignments/:id/submit`          | Submit file (student)  |

---

## 🔌 Socket.io Events

| Event                 | Direction       | Payload                              |
|-----------------------|-----------------|--------------------------------------|
| `join-room`           | Client → Server | `{ roomId }`                         |
| `room-state`          | Server → Client | `{ participants, raisedHands }`      |
| `send-message`        | Client → Server | `{ roomId, text }`                   |
| `new-message`         | Server → All    | `{ message }`                        |
| `whiteboard-draw`     | Client → Server | `{ roomId, stroke }`                 |
| `whiteboard-clear`    | Client → Server | `{ roomId }`                         |
| `whiteboard-undo`     | Client → Server | `{ roomId }`                         |
| `raise-hand`          | Client → Server | `{ roomId, raised }`                 |
| `allow-speak`         | Client → Server | `{ roomId, userId }`                 |
| `remove-participant`  | Client → Server | `{ roomId, userId }`                 |
| `end-room`            | Client → Server | `{ roomId }`                         |
| `room-ended`          | Server → All    | `{ message }`                        |
| `kicked`              | Server → Client | `{ message }`                        |

---

## 🌐 MongoDB Atlas (Cloud)

Replace your `.env` `MONGO_URI`:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/edulive
```

---

## 📦 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Socket.io-client, React Router, React Hot Toast
- **Backend**: Node.js, Express, Socket.io, Mongoose, JWT, bcryptjs, Multer
- **Database**: MongoDB

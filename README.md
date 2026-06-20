# TaskFlow

A Kanban-style task manager built with React and Express. Register an account, then create tasks and move them between To Do, In Progress, and Done columns.

## Tech Stack

- **Frontend:** React 19, Vite, React Router v7, Axios
- **Backend:** Node.js, Express 5, JWT authentication, bcryptjs
- **Database:** SQLite (via better-sqlite3)

## Features

- User registration and login with JWT-based auth
- Create, view, and delete tasks
- Move tasks between To Do / In Progress / Done
- Per-user task isolation

## Local Setup

```bash
cd server
npm install
echo "JWT_SECRET=your_secret_here" > .env
npm start
```

```bash
cd client
npm install
npm run dev
```

Backend runs on port 5001, frontend on Vite's default dev port.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { requireAuth } from './auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, passwordHash);

  const token = jwt.sign({ userId: lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: lastInsertRowid, name, email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/tasks', requireAuth, (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(tasks);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)')
    .run(req.userId, title, description || '');

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(lastInsertRowid);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['todo', 'in_progress', 'done'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const result = db
    .prepare('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?')
    .run(status, req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ message: 'Task not found' });

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ message: 'Task not found' });
  res.status(204).end();
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`TaskFlow server running on port ${PORT}`));

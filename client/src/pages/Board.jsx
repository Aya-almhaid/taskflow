import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadTasks = async () => {
    const { data } = await api.get('/tasks');
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post('/tasks', { title, description });
    setTitle('');
    setDescription('');
    loadTasks();
  };

  const moveTask = async (id, status) => {
    await api.patch(`/tasks/${id}/status`, { status });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    loadTasks();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="board-page">
      <header>
        <h1>TaskFlow</h1>
        <div>
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      <form className="add-task" onSubmit={handleAdd}>
        <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>

      <div className="columns">
        {COLUMNS.map((col) => (
          <div className="column" key={col.key}>
            <h2>{col.label}</h2>
            {tasks
              .filter((t) => t.status === col.key)
              .map((task) => (
                <div className="task-card" key={task.id}>
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                  <div className="task-actions">
                    {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                      <button key={c.key} onClick={() => moveTask(task.id, c.key)}>
                        → {c.label}
                      </button>
                    ))}
                    <button className="delete" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

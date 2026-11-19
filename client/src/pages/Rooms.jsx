// Rooms: admin can add rooms and allot students. Students can only view.
import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Rooms({ user }) {
  const isAdmin = user.role === 'admin';
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ roomNo: '', block: 'A', floor: 0, capacity: 2 });
  const [pick, setPick] = useState({}); // chosen student for each room
  const [error, setError] = useState('');

  async function load() {
    try {
      setRooms(await api('/rooms'));
      if (isAdmin) setStudents(await api('/students'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  // Run an action, show error if it fails, then reload
  async function run(fn) {
    setError('');
    try {
      await fn();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const addRoom = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/rooms', 'POST', form);
      setForm({ ...form, roomNo: '' });
    });
  };

  const freeStudents = students.filter((s) => !s.room); // students without a room

  return (
    <div>
      <h2>Rooms</h2>
      {error && <p className="error">{error}</p>}

      {isAdmin && (
        <form className="card form-grid" onSubmit={addRoom}>
          <h3>Add room</h3>
          <input placeholder="Room no" value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} required />
          <input placeholder="Block" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} />
          <input type="number" min="0" max="50" placeholder="Floor" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          <input type="number" min="1" max="10" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <div><button type="submit">Add</button></div>
        </form>
      )}

      {rooms.length === 0 && <p className="muted">No rooms yet</p>}
      <div className="grid">
        {rooms.map((r) => (
          <div className="card" key={r._id}>
            <h3>Room {r.roomNo} <span className="muted">Block {r.block}, Floor {r.floor}</span></h3>
            <p>
              <span className={r.occupants.length >= r.capacity ? 'badge red-bg' : 'badge green-bg'}>
                {r.occupants.length} / {r.capacity} beds
              </span>
            </p>
            <ul>
              {r.occupants.map((o) => (
                <li key={o._id}>
                  {o.name} {isAdmin && <button className="small red" onClick={() => run(() => api('/rooms/' + r._id + '/vacate', 'POST', { studentId: o._id }))}>Remove</button>}
                </li>
              ))}
              {r.occupants.length === 0 && <li className="muted">Empty</li>}
            </ul>

            {isAdmin && r.occupants.length < r.capacity && (
              <div className="row">
                <select value={pick[r._id] || ''} onChange={(e) => setPick({ ...pick, [r._id]: e.target.value })}>
                  <option value="">Select student</option>
                  {freeStudents.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <button disabled={!pick[r._id]} onClick={() => run(() => api('/rooms/' + r._id + '/allot', 'POST', { studentId: pick[r._id] }))}>Allot</button>
              </div>
            )}
            {isAdmin && r.occupants.length === 0 && (
              <button className="small red" onClick={() => confirm('Delete room ' + r.roomNo + '?') && run(() => api('/rooms/' + r._id, 'DELETE'))}>Delete room</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

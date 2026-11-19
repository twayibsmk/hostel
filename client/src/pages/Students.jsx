// Admin page: add, edit and delete students
import { useEffect, useState } from 'react';
import { api } from '../api.js';

const empty = { name: '', email: '', rollNo: '', branch: '', year: '', phone: '', guardianName: '', guardianPhone: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null); // null = adding new
  const [error, setError] = useState('');

  async function load() {
    try {
      setStudents(await api('/students'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api('/students/' + editId, 'PUT', form);
      else await api('/students', 'POST', form);
      setForm(empty);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(s) {
    setEditId(s._id);
    setForm({ ...empty, ...s });
    window.scrollTo(0, 0);
  }

  async function remove(id) {
    if (!confirm('Delete this student? His fees, complaints and room will also be removed.')) return;
    try {
      await api('/students/' + id, 'DELETE');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(id) {
    if (!confirm('Reset password to student123?')) return;
    try {
      const data = await api('/students/' + id + '/reset-password', 'PUT');
      alert(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Students</h2>
      {error && <p className="error">{error}</p>}

      <form className="card form-grid" onSubmit={save}>
        <h3>{editId ? 'Edit student' : 'Add student'}</h3>
        <input name="name" placeholder="Name" value={form.name} onChange={change} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required disabled={!!editId} />
        <input name="rollNo" placeholder="Roll no" value={form.rollNo || ''} onChange={change} />
        <input name="branch" placeholder="Branch" value={form.branch || ''} onChange={change} />
        <input name="year" type="number" min="1" max="6" placeholder="Year" value={form.year || ''} onChange={change} />
        <input name="phone" placeholder="Phone" maxLength="15" value={form.phone || ''} onChange={change} />
        <input name="guardianName" placeholder="Guardian name" value={form.guardianName || ''} onChange={change} />
        <input name="guardianPhone" placeholder="Guardian phone" value={form.guardianPhone || ''} onChange={change} />
        <div>
          <button type="submit">{editId ? 'Update' : 'Add'}</button>
          {editId && <button type="button" className="gray" onClick={() => { setEditId(null); setForm(empty); }}>Cancel</button>}
        </div>
        {!editId && <p className="muted">New students get the default password: student123</p>}
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Roll no</th><th>Branch</th><th>Year</th><th>Phone</th><th>Room</th><th></th></tr>
          </thead>
          <tbody>
            {students.length === 0 && <tr><td colSpan="7" className="muted">No students yet</td></tr>}
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.name}<br /><span className="muted">{s.email}</span></td>
                <td>{s.rollNo}</td>
                <td>{s.branch}</td>
                <td>{s.year}</td>
                <td>{s.phone}</td>
                <td>{s.room ? s.room.roomNo : '-'}</td>
                <td>
                  <button onClick={() => edit(s)}>Edit</button>
                  <button className="gray" onClick={() => resetPassword(s._id)}>Reset password</button>
                  <button className="red" onClick={() => remove(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

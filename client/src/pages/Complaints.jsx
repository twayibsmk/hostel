// Complaints: student raises, admin updates status
import { useEffect, useState } from 'react';
import { api } from '../api.js';

const categories = ['Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'Internet', 'Other'];

export default function Complaints({ user }) {
  const isAdmin = user.role === 'admin';
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ category: 'Electrical', description: '' });
  const [error, setError] = useState('');

  async function load() {
    try {
      setList(await api('/complaints'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/complaints', 'POST', form);
      setForm({ ...form, description: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(id, status) {
    try {
      await api('/complaints/' + id, 'PUT', { status });
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  const color = { Open: 'red-bg', 'In Progress': 'yellow-bg', Resolved: 'green-bg' };

  return (
    <div>
      <h2>Complaints / Maintenance</h2>
      {error && <p className="error">{error}</p>}

      {!isAdmin && (
        <form className="card form-grid" onSubmit={submit}>
          <h3>Raise a complaint</h3>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea placeholder="Describe the problem (5 to 500 characters)" maxLength="500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div><button type="submit">Submit</button></div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>{isAdmin && <th>Student</th>}<th>Category</th><th>Problem</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c._id}>
                {isAdmin && <td>{c.student ? c.student.name : '(deleted)'}</td>}
                <td>{c.category}</td>
                <td>{c.description}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td>
                  {isAdmin ? (
                    <select value={c.status} onChange={(e) => changeStatus(c._id, e.target.value)}>
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  ) : (
                    <span className={'badge ' + color[c.status]}>{c.status}</span>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="5" className="muted">No complaints</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

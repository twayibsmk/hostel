// Fees: admin creates fees and marks them paid. Student sees own dues.
import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Fees({ user }) {
  const isAdmin = user.role === 'admin';
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student: '', description: 'Hostel fee', amount: '', dueDate: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      setFees(await api('/fees'));
      if (isAdmin) setStudents(await api('/students'));
    } catch (err) {
      setMsg(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function addFee(e) {
    e.preventDefault();
    try {
      await api('/fees', 'POST', form);
      setForm({ ...form, amount: '' });
      setMsg('Fee added');
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function pay(id) {
    try {
      await api('/fees/' + id + '/pay', 'PUT');
    } catch (err) {
      setMsg(err.message);
    }
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this fee?')) return;
    try {
      await api('/fees/' + id, 'DELETE');
    } catch (err) {
      setMsg(err.message);
    }
    load();
  }

  async function remind() {
    try {
      const data = await api('/fees/remind', 'POST');
      setMsg(data.message);
    } catch (err) {
      setMsg(err.message);
    }
  }

  const today = new Date();

  return (
    <div>
      <h2>Fees</h2>
      {msg && <p className="info">{msg}</p>}

      {isAdmin && (
        <>
          <form className="card form-grid" onSubmit={addFee}>
            <h3>Add fee</h3>
            <select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input placeholder="Description" maxLength="100" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input type="number" min="1" placeholder="Amount (Rs)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            <div><button type="submit">Add</button></div>
          </form>
          <button className="gray" onClick={remind}>🔔 Send due reminders</button>
        </>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>{isAdmin && <th>Student</th>}<th>Description</th><th>Amount</th><th>Due date</th><th>Status</th>{isAdmin && <th></th>}</tr>
          </thead>
          <tbody>
            {fees.map((f) => {
              const overdue = f.status === 'pending' && new Date(f.dueDate) < today;
              return (
                <tr key={f._id}>
                  {isAdmin && <td>{f.student ? f.student.name : '(deleted)'}</td>}
                  <td>{f.description}</td>
                  <td>Rs {f.amount}</td>
                  <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={f.status === 'paid' ? 'badge green-bg' : overdue ? 'badge red-bg' : 'badge yellow-bg'}>
                      {f.status === 'paid' ? 'Paid' : overdue ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      {f.status === 'pending' && <button onClick={() => pay(f._id)}>Mark paid</button>}
                      <button className="red" onClick={() => remove(f._id)}>Delete</button>
                    </td>
                  )}
                </tr>
              );
            })}
            {fees.length === 0 && <tr><td colSpan="6" className="muted">No fees yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

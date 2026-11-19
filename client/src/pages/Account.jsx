// Change my own password
import { useState } from 'react';
import { api } from '../api.js';

export default function Account() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', again: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    if (form.newPassword.length < 6) return setError('New password must be at least 6 characters');
    if (form.newPassword !== form.again) return setError('The two new passwords do not match');
    try {
      await api('/auth/change-password', 'POST', { oldPassword: form.oldPassword, newPassword: form.newPassword });
      setMsg('Password changed successfully');
      setForm({ oldPassword: '', newPassword: '', again: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Account</h2>
      <form className="card login-box" style={{ margin: 0 }} onSubmit={submit}>
        <h3>Change password</h3>
        {error && <p className="error">{error}</p>}
        {msg && <p className="info">{msg}</p>}
        <input type="password" placeholder="Old password" value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} required />
        <input type="password" placeholder="New password (min 6 characters)" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
        <input type="password" placeholder="Repeat new password" value={form.again} onChange={(e) => setForm({ ...form, again: e.target.value })} required />
        <button type="submit">Change password</button>
      </form>
    </div>
  );
}

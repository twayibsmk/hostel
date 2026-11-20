import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNo: '', branch: '', year: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false); // stops double clicking
  const navigate = useNavigate();

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (isRegister && form.password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true);
    try {
      const data = await api(isRegister ? '/auth/register' : '/auth/login', 'POST', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="login-box card">
      <h2>🏠 Hostel Manager</h2>
      <p className="muted">{isRegister ? 'Student registration' : 'Please login'}</p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={submit}>
        {isRegister && (
          <>
            <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
            <input name="rollNo" placeholder="Roll number" value={form.rollNo} onChange={change} />
            <input name="branch" placeholder="Branch" value={form.branch} onChange={change} />
            <input name="year" type="number" placeholder="Year" value={form.year} onChange={change} />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={change} />
          </>
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
        <input name="password" type="password" placeholder={isRegister ? 'Password (min 6 characters)' : 'Password'} value={form.password} onChange={change} required />
        <button type="submit" disabled={busy}>{busy ? 'Please wait...' : isRegister ? 'Register' : 'Login'}</button>
      </form>

      <p className="link" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Already have an account? Login' : 'New student? Register here'}
      </p>
    </div>
  );
}

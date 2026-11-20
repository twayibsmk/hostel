import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Notifications() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setList(await api('/notifications'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function markRead() {
    try {
      await api('/notifications/read-all', 'PUT');
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  return (
    <div>
      <h2>Notifications</h2>
      {error && <p className="error">{error}</p>}
      <button className="gray" onClick={markRead}>Mark all as read</button>
      {list.map((n) => (
        <div key={n._id} className={'card ' + (n.read ? '' : 'unread')}>
          {n.message}
          <div className="muted">{new Date(n.createdAt).toLocaleString()}</div>
        </div>
      ))}
      {list.length === 0 && <p className="muted">No notifications</p>}
    </div>
  );
}

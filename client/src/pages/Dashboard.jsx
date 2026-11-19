import { useEffect, useState } from 'react';
import { api } from '../api.js';

function Box({ title, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="muted">{title}</div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      {user.role === 'admin' ? (
        <div className="grid">
          <Box title="Students" value={stats.students} />
          <Box title="Rooms" value={stats.rooms} />
          <Box title="Occupied beds" value={stats.occupiedBeds + ' / ' + stats.totalBeds} />
          <Box title="Vacant beds" value={stats.vacantBeds} />
          <Box title="Pending fees" value={stats.pendingFees + ' (Rs ' + stats.pendingAmount + ')'} />
          <Box title="Open complaints" value={stats.openComplaints} />
        </div>
      ) : (
        <div className="grid">
          <Box title="My room" value={stats.room} />
          <Box title="Pending fees" value={stats.pendingFees + ' (Rs ' + stats.pendingAmount + ')'} />
          <Box title="Open complaints" value={stats.openComplaints} />
        </div>
      )}
    </div>
  );
}

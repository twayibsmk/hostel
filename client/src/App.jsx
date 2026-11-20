import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Rooms from './pages/Rooms.jsx';
import Fees from './pages/Fees.jsx';
import Complaints from './pages/Complaints.jsx';
import Mess from './pages/Mess.jsx';
import Notifications from './pages/Notifications.jsx';
import Account from './pages/Account.jsx';

// Read the saved user (if logged in)
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function logout() {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  }

  // Not logged in: only the login page is shown
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const isAdmin = user.role === 'admin';
  const close = () => setMenuOpen(false);

  return (
    <div>
      <header className="navbar">
        <b>🏠 Hostel Manager</b>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <nav className={menuOpen ? 'open' : ''} onClick={close}>
          <NavLink to="/">Dashboard</NavLink>
          {isAdmin && <NavLink to="/students">Students</NavLink>}
          <NavLink to="/rooms">Rooms</NavLink>
          <NavLink to="/fees">Fees</NavLink>
          <NavLink to="/complaints">Complaints</NavLink>
          <NavLink to="/mess">Mess</NavLink>
          <NavLink to="/notifications">Notifications</NavLink>
          <NavLink to="/account">Account</NavLink>
          <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); }}>Logout ({user.name})</a>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/students" element={isAdmin ? <Students /> : <Navigate to="/" />} />
          <Route path="/rooms" element={<Rooms user={user} />} />
          <Route path="/fees" element={<Fees user={user} />} />
          <Route path="/complaints" element={<Complaints user={user} />} />
          <Route path="/mess" element={<Mess user={user} />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

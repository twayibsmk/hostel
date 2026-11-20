// Mess: weekly menu (admin edits) + student meal opt-in for a date
import { useEffect, useState } from 'react';
import { api } from '../api.js';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const meals = ['Breakfast', 'Lunch', 'Dinner'];

// Tomorrow's date as YYYY-MM-DD
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Today's date as YYYY-MM-DD (students cannot pick past days)
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Mess({ user }) {
  const isAdmin = user.role === 'admin';
  const [menu, setMenu] = useState([]);
  const [date, setDate] = useState(tomorrow());
  const [mine, setMine] = useState([]); // meals the student opted in
  const [counts, setCounts] = useState({});
  const [error, setError] = useState('');
  const [edit, setEdit] = useState({ day: 'Monday', meal: 'Breakfast', items: '' });

  async function loadMenu() {
    try {
      setMenu(await api('/mess/menu'));
    } catch (err) {
      setError(err.message);
    }
  }
  async function loadAttendance() {
    if (!date) return; // user cleared the date box
    try {
      if (isAdmin) setCounts(await api('/mess/attendance/count?date=' + date));
      else setMine((await api('/mess/attendance/me?date=' + date)).map((a) => a.meal));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadMenu(); }, []);
  useEffect(() => { loadAttendance(); }, [date]);

  function itemsFor(day, meal) {
    const row = menu.find((m) => m.day === day && m.meal === meal);
    return row ? row.items : '-';
  }

  async function saveMenu(e) {
    e.preventDefault();
    try {
      await api('/mess/menu', 'PUT', edit);
      setEdit({ ...edit, items: '' });
      loadMenu();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(meal) {
    try {
      await api('/mess/attendance', 'POST', { date, meal });
      loadAttendance();
    } catch (err) {
      setError(err.message);
    }
  }

  // The weekday name of the chosen date, to show that day's menu
  const dayName = date ? days[(new Date(date).getUTCDay() + 6) % 7] : '';

  return (
    <div>
      <h2>Mess</h2>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Meals on <input type="date" value={date} min={isAdmin ? undefined : today()} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} /> ({dayName})</h3>
        <div className="grid">
          {meals.map((meal) => (
            <div key={meal} className="stat">
              <b>{meal}</b>
              <p>{itemsFor(dayName, meal)}</p>
              {isAdmin ? (
                <span className="badge green-bg">{counts[meal] || 0} students eating</span>
              ) : (
                <button className={mine.includes(meal) ? '' : 'gray'} onClick={() => toggle(meal)}>
                  {mine.includes(meal) ? '✔ I will eat' : 'Skip (tap to opt in)'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <form className="card form-grid" onSubmit={saveMenu}>
          <h3>Edit menu</h3>
          <select value={edit.day} onChange={(e) => setEdit({ ...edit, day: e.target.value })}>
            {days.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={edit.meal} onChange={(e) => setEdit({ ...edit, meal: e.target.value })}>
            {meals.map((m) => <option key={m}>{m}</option>)}
          </select>
          <input placeholder="Items (e.g. Rice, Dal, Curd)" maxLength="200" value={edit.items} onChange={(e) => setEdit({ ...edit, items: e.target.value })} required />
          <div><button type="submit">Save</button></div>
        </form>
      )}

      <h3>Weekly menu</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Day</th>{meals.map((m) => <th key={m}>{m}</th>)}</tr></thead>
          <tbody>
            {days.map((d) => (
              <tr key={d}>
                <td><b>{d}</b></td>
                {meals.map((m) => <td key={m}>{itemsFor(d, m)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

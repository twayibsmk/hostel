// One small helper to talk to the backend.
// Usage: const data = await api('/rooms')
//        await api('/rooms', 'POST', { roomNo: '101' })
const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token');

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: 'Bearer ' + token }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // server is off or there is no internet
    throw new Error('Cannot reach the server. Check your internet and try again.');
  }

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // reply was not JSON (for example a server crash page)
  }

  // Token expired or account deleted: send the user back to login
  if (res.status === 401 && token) {
    localStorage.clear();
    window.location.href = '/login';
    throw new Error(data.message || 'Session expired. Please login again.');
  }

  if (!res.ok) throw new Error(data.message || 'Something went wrong (error ' + res.status + ')');
  return data;
}

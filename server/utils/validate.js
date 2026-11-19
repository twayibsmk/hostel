// Small helper functions to check data before saving it

// Is this a valid MongoDB id? (24 letters/numbers)
const isId = (id) => /^[a-f\d]{24}$/i.test(String(id));

// Is this a real date like 2026-11-30 ?
function isDateText(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(text))) return false;
  const d = new Date(text);
  return !isNaN(d) && d.toISOString().slice(0, 10) === text;
}

// Keep only allowed student fields, remove extra spaces, make email lowercase
function cleanStudent(body) {
  const out = {};
  for (const key of ['name', 'rollNo', 'branch', 'phone', 'guardianName', 'guardianPhone']) {
    if (body[key] !== undefined && body[key] !== null) out[key] = String(body[key]).trim();
  }
  if (body.email !== undefined) out.email = String(body.email).trim().toLowerCase();
  if (body.year !== undefined && body.year !== '' && body.year !== null) out.year = Number(body.year);
  return out;
}

// Returns an error message, or null if everything is fine
function checkStudent(d, isNew) {
  if (isNew && !d.name) return 'Name is required';
  if (d.name !== undefined && (d.name.length < 2 || d.name.length > 60)) return 'Name must be 2 to 60 characters';
  if (isNew && !d.email) return 'Email is required';
  if (d.email !== undefined && !/^\S+@\S+\.\S+$/.test(d.email)) return 'Please enter a valid email';
  if (d.year !== undefined && !(Number.isInteger(d.year) && d.year >= 1 && d.year <= 6)) return 'Year must be between 1 and 6';
  for (const key of ['phone', 'guardianPhone']) {
    if (d[key] && !/^[0-9+\- ]{7,15}$/.test(d[key])) return 'Please enter a valid phone number';
  }
  return null;
}

module.exports = { isId, isDateText, cleanStudent, checkStudent };

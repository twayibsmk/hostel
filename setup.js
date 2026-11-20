// Run once:  node setup.js
// Asks for your database link, creates server/.env, and (if you want) adds sample data.
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

// Makes sure the link ends with the database name "hostel"
function addDbName(uri) {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)\/?([^?]*)(\?.*)?$/);
  if (!match) return uri;
  const db = match[2] || 'hostel';
  return match[1] + '/' + db + (match[3] || '');
}

(async () => {
  console.log('\n=== Hostel Management setup ===\n');
  console.log('Paste your MongoDB Atlas connection string (starts with mongodb+srv://).');
  console.log('Or just press Enter to use MongoDB installed on this computer.\n');

  let uri = await ask('MongoDB link: ');
  if (!uri) uri = 'mongodb://127.0.0.1:27017/hostel';
  if (!uri.startsWith('mongodb')) {
    console.log('\nThat does not look like a MongoDB link. It must start with mongodb:// or mongodb+srv://');
    process.exit(1);
  }
  if (uri.includes('<') || uri.includes('>')) {
    console.log('\nYour link still has <db_password> or <db_username> in it. Replace the whole thing, including the < > signs, with the real value.');
    process.exit(1);
  }
  uri = addDbName(uri);

  const env = 'PORT=5000\nMONGO_URI=' + uri + '\nJWT_SECRET=' + crypto.randomBytes(24).toString('hex') + '\n';
  fs.writeFileSync(path.join(__dirname, 'server', '.env'), env);
  console.log('\nSaved settings to server/.env');

  const answer = await ask('\nAdd sample data (admin, students, rooms, menu)? Type y and press Enter: ');
  rl.close();
  if (answer.toLowerCase().startsWith('y')) {
    try {
      execSync('node server/seed.js', { stdio: 'inherit', cwd: __dirname });
    } catch (e) {
      console.log('\nCould not add sample data. Check your MongoDB link and that Atlas allows your IP (Network Access: 0.0.0.0/0).');
      process.exit(1);
    }
  }
  console.log('\nSetup finished.\n');
})();

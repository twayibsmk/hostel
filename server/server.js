// Main file: starts the server and connects to MongoDB
require('dotenv').config();
require('express-async-errors'); // lets errors in async routes reach our error handler
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Each feature has its own routes file
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/mess', require('./routes/mess'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/', (req, res) => res.send('Hostel Management API is running'));

// Unknown API address
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Any error in a route ends up here. We turn common errors into clear messages.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON sent' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Data is too large' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid value or id' });
  if (err.code === 11000) return res.status(400).json({ message: 'This record already exists' });
  console.log(err);
  res.status(500).json({ message: 'Server error. Please try again.' });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB. Reuse the connection if it already exists (Vercel may
// import this module more than once). The connection is started eagerly so it
// is ready by the time the first request arrives, both locally and on Vercel.
let connecting = null;
function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        connecting = null; // allow retry on next request
        console.log('DB connection failed:', err.message);
        throw err;
      });
  }
  return connecting;
}

if (process.env.MONGO_URI) {
  connectDB();
}

// When run directly (npm start / npm run dev), start listening on a port
if (require.main === module) {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.log('Please create server/.env with MONGO_URI and JWT_SECRET (see .env.example)');
    process.exit(1);
  }
  connectDB().then(() => {
    app.listen(PORT, () => console.log('Server running on port ' + PORT));
  });
}

module.exports = app;

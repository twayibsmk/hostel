// Main file: starts the server and connects to MongoDB
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // server/.env, works from any folder
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

// If the website has been built (client/dist), this server also serves it.
// That way one command runs everything at http://localhost:5000
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
} else {
  app.get('/', (req, res) => res.send('Hostel Management API is running'));
}

// Unknown API address
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Any other address opens the website (so refreshing /fees etc. works)
if (fs.existsSync(dist)) {
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

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

if (require.main === module) {
  // Stop early with a clear message if the settings are missing
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.log('Please create server/.env with MONGO_URI and JWT_SECRET (see .env.example)');
    process.exit(1);
  }
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log('Server running on port ' + PORT));
    })
    .catch((err) => {
      console.log('DB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
